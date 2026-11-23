import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { ResendForm } from './resend-form'

export const metadata: Metadata = { title: 'Confirmez votre adresse e-mail' }

export default async function VerificationPage({ searchParams }: { searchParams: Promise<{ email?: string; medecin?: string; pieces?: string }> }) {
  const sp = await searchParams
  const email = (sp.email ?? '').slice(0, 254)
  return (
    <div className="v3-center">
      <div className="v3-icon-circle"><Icon name="mail-check" /></div>
      <h1 className="auth-title">Confirmez votre adresse e-mail</h1>
      <p className="auth-subtitle">
        Nous avons envoyé un lien d’activation{email ? <> à <strong>{email}</strong></> : null}. Ouvrez-le pour activer votre compte.
      </p>
      {sp.medecin ? (
        <p className="notice">Votre dossier médecin est bien reçu et <strong>en cours de validation</strong>. Après avoir confirmé votre adresse, connectez-vous pour suivre son état. Vous recevrez un e-mail dès la décision.</p>
      ) : null}
      {sp.pieces === 'incompletes' ? (
        <p className="notice warning">Certaines pièces n’ont pas pu être envoyées. Vous pourrez les ajouter depuis votre espace après connexion.</p>
      ) : null}
      <ul className="v3-checklist">
        <li><Icon name="inbox" /> Pensez à regarder dans les courriers indésirables.</li>
        <li><Icon name="clock" /> Le lien reste valable 24 heures.</li>
      </ul>
      <Link className="btn btn-primary btn-lg btn-block" href="/connexion"><Icon name="log-in" /> J’ai confirmé, me connecter</Link>
      {email ? <ResendForm email={email} /> : null}
    </div>
  )
}
