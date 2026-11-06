import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'
import { getSession, homeFor } from '@/lib/auth'

export const metadata: Metadata = { title: 'Connexion' }

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ suite?: string; confirme?: string; lien?: string }> }) {
  const sp = await searchParams
  const session = await getSession()
  if (session) redirect(homeFor(session))
  return (
    <>
      <h1 className="auth-title">Bon retour</h1>
      <p className="auth-subtitle">Connectez-vous pour accéder à votre espace</p>
      {sp.confirme ? <p className="notice success" style={{ marginBottom: 16 }}>Adresse e-mail confirmée. Vous pouvez vous connecter.</p> : null}
      {sp.lien === 'invalide' ? <p className="notice warning" style={{ marginBottom: 16 }}>Ce lien n’est plus valable. Connectez-vous ou demandez un nouveau lien.</p> : null}
      <LoginForm suite={sp.suite ?? ''} />
      <p className="auth-footer">Pas encore de compte ? <Link className="auth-link" href="/inscription">Créer un compte</Link></p>
    </>
  )
}
