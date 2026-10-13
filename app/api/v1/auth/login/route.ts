import { type NextRequest } from 'next/server'
import { apiError, apiJson, guardMutation, readJson } from '@/lib/api/http'
import { classifyIdentifier } from '@/lib/api/session'
import { getApiSession } from '@/lib/api/current-session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const BAD_CREDENTIALS = () => apiError(401, 'INVALID_CREDENTIALS', 'Identifiant ou mot de passe incorrect.')

/** Téléphone -> email du compte (le backend se connecte par email + mot de passe). Serveur uniquement. */
async function emailFromPhone(phone: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('id').eq('phone', phone).maybeSingle()
  if (!profile) return null
  const { data } = await admin.auth.admin.getUserById(profile.id)
  return data.user?.email ?? null
}

// POST /auth/login { identifier, password, remember } -> Session
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request)
  if (blocked) return blocked

  const body = await readJson(request)
  const identifier = typeof body?.identifier === 'string' ? classifyIdentifier(body.identifier) : null
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!identifier || !password || password.length > 256) {
    return apiError(400, 'VALIDATION', 'Renseignez un email ou un téléphone valide et votre mot de passe.', {
      identifier: 'Email ou téléphone invalide.',
    })
  }

  // Réponse identique que le compte existe ou non (pas d'énumération de comptes).
  let email: string | null = identifier.kind === 'email' ? identifier.value : null
  if (identifier.kind === 'phone') {
    try { email = await emailFromPhone(identifier.value) } catch { return apiError(503, 'UNAVAILABLE', 'Service indisponible. Réessayez dans quelques instants.') }
  }
  if (!email) return BAD_CREDENTIALS()

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.status === 429) return apiError(429, 'RATE_LIMITED', 'Trop de tentatives. Patientez avant de réessayer.')
    if (error.status && error.status >= 500) return apiError(503, 'UNAVAILABLE', 'Service indisponible. Réessayez dans quelques instants.')
    return BAD_CREDENTIALS()
  }

  const session = await getApiSession()
  if (!session) {
    await supabase.auth.signOut()
    return apiError(403, 'ACCOUNT_UNAVAILABLE', 'Ce compte n’est pas utilisable. Contactez le support.')
  }
  return apiJson(session)
}
