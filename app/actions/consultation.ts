'use server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { friendlyError } from '@/lib/errors'
import { fullName } from '@/lib/format'
import { getVisioAccess } from '@/lib/services/visio'

export type JoinResult =
  | { ok: true; mode: 'daily' | 'test'; url: string | null; closesAt: string }
  | { ok: false; error: string; code?: string }

/**
 * Entrée dans la salle : la base vérifie le créneau, le paiement du solde et le rôle,
 * puis on prépare l'accès Daily.co nominatif (ou le mode test).
 */
export async function joinConsultationAction(appointmentId: string): Promise<JoinResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Session expirée. Reconnectez-vous.' }
  if (!/^[0-9a-f-]{36}$/i.test(appointmentId)) return { ok: false, error: 'Consultation introuvable.' }
  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('join_consultation', { p_appointment: appointmentId })
    .single<{ room_name: string; participant: 'patient' | 'medecin'; closes_at: string }>()
  if (error || !data) {
    const code = error?.message?.match(/[A-Z_]{6,}/)?.[0]
    return { ok: false, error: friendlyError(error), code }
  }
  try {
    const isDoctor = data.participant === 'medecin'
    const name = isDoctor ? `${session.doctor?.title ?? 'Dr'} ${fullName(session.profile)}`.trim() : fullName(session.profile)
    const access = await getVisioAccess({ roomName: data.room_name, userName: name, isDoctor, closesAt: data.closes_at })
    return { ok: true, mode: access.mode, url: access.url, closesAt: data.closes_at }
  } catch (e) {
    console.error('[visio]', e)
    return { ok: false, error: 'La vidéo ne répond pas pour le moment. Le chat reste disponible ; réessayez dans un instant.' }
  }
}
