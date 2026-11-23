import { type NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Lien reçu par e-mail (confirmation de compte ou réinitialisation du mot de passe).
 * Modèles d'e-mail Supabase : {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 * (et &type=recovery&suite=/reinitialiser pour le mot de passe) — voir README.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const suite = searchParams.get('suite')
  const next = suite && suite.startsWith('/') && !suite.startsWith('//') ? suite : '/connexion?confirme=1'

  const code = searchParams.get('code')
  const supabase = await createClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      if (type === 'recovery') return NextResponse.redirect(`${origin}/reinitialiser`)
      return NextResponse.redirect(`${origin}${next === '/connexion?confirme=1' ? '/espace' : next}`)
    }
  } else if (code) {
    // Lien au format par défaut de Supabase (PKCE) : fonctionne si ouvert dans le même navigateur.
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next === '/connexion?confirme=1' ? '/espace' : next}`)
  }
  return NextResponse.redirect(`${origin}/connexion?lien=invalide`)
}
