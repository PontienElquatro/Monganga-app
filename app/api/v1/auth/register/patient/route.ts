import { type NextRequest } from 'next/server'
import { apiError, apiJson, guardMutation, readJson } from '@/lib/api/http'
import { validateRegistration } from '@/lib/api/register'
import { getApiSession } from '@/lib/api/current-session'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// POST /auth/register/patient { name, email, phone?, password, consent }
// Réponse 201 : { signedIn: true, session } (confirmation d'email désactivée)
//            ou { signedIn: false, needsEmailConfirmation: true } (lien envoyé par Supabase).
// Le rôle n'est jamais lu depuis le navigateur : le trigger de la base crée un profil « patient ».
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request)
  if (blocked) return blocked

  const parsed = validateRegistration(await readJson(request))
  if (!parsed.ok) return apiError(400, 'VALIDATION', 'Vérifiez les champs du formulaire.', parsed.fields)
  const { name, email, phone, password } = parsed.value

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
  if (error) {
    if (error.status === 429) return apiError(429, 'RATE_LIMITED', 'Trop de tentatives. Patientez avant de réessayer.')
    if (error.code === 'user_already_exists' || /already registered/i.test(error.message)) {
      return apiError(409, 'EMAIL_TAKEN', 'Un compte existe déjà avec cet email.', { email: 'Email déjà utilisé.' })
    }
    if (error.code === 'weak_password') return apiError(400, 'VALIDATION', 'Mot de passe trop faible.', { password: 'Choisissez un mot de passe plus robuste.' })
    if (error.status && error.status >= 500) return apiError(503, 'UNAVAILABLE', 'Service indisponible. Réessayez dans quelques instants.')
    return apiError(400, 'VALIDATION', 'Inscription impossible avec ces informations.')
  }

  // Téléphone : enregistré côté serveur (client admin) pour la connexion par numéro. Facultatif,
  // jamais bloquant : un numéro déjà pris (contrainte d'unicité) est simplement ignoré.
  if (phone && data.user) {
    try { await createAdminClient().from('profiles').update({ phone }).eq('id', data.user.id) } catch { /* non bloquant */ }
  }

  if (data.session) {
    const session = await getApiSession()
    if (session) return apiJson({ signedIn: true, session }, 201)
  }
  return apiJson({ signedIn: false, needsEmailConfirmation: true }, 201)
}
