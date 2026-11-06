import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { DoctorProfile, Profile, UserRole } from '@/lib/types'

export interface Session {
  userId: string
  email: string
  profile: Profile
  doctor: DoctorProfile | null
}

/** Session courante (mise en cache pour la durée de la requête). */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single<Profile>()
  if (!profile) return null
  let doctor: DoctorProfile | null = null
  if (profile.role === 'medecin') {
    const { data: d } = await supabase
      .from('doctor_profiles')
      .select('id, title, specialty, bio, languages, years_experience, commune, fee_cents, status, payout_method, payout_account, payout_holder, admin_message, submitted_at, decided_at')
      .eq('id', data.user.id)
      .maybeSingle<DoctorProfile>()
    doctor = d ?? null
  }
  return { userId: data.user.id, email: data.user.email ?? profile.email, profile, doctor }
})

/** Page d'accueil de chaque rôle. */
export function homeFor(session: Session): string {
  if (session.profile.suspended_at) return '/compte-suspendu'
  if (session.profile.role === 'admin') return '/admin'
  if (session.profile.role === 'medecin') return session.doctor?.status === 'valide' ? '/medecin' : '/dossier'
  return '/patient'
}

/** Exige un rôle ; sinon renvoie vers la bonne page. */
export async function requireRole(role: UserRole): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/connexion')
  if (session.profile.suspended_at) redirect('/compte-suspendu')
  if (session.profile.role !== role) redirect(homeFor(session))
  if (role === 'medecin' && session.doctor?.status !== 'valide') redirect('/dossier')
  return session
}
