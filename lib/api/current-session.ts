import { createClient } from '@/lib/supabase/server'
import { toApiSession, type ApiSession } from './session'

/**
 * Session du compte connecté, au format du front. Utilise getUser() (vérifié côté serveur
 * Supabase) et jamais getSession() pour l'identité. Le rôle vient de la base, pas du navigateur.
 */
export async function getApiSession(): Promise<ApiSession | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (!profile) return null
  const { data: { session } } = await supabase.auth.getSession() // uniquement pour la date d'expiration
  return toApiSession({
    id: user.id,
    role: profile.role,
    fullName: profile.full_name,
    email: user.email,
    expiresAtSeconds: session?.expires_at,
  })
}
