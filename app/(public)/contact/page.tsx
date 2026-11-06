import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'

export const metadata: Metadata = { title: 'Contact' }

// Coordonnées officielles de MONGANGA : à confirmer par le client avant la mise en ligne.
const CONTACT_EMAIL = 'contact@monganga.cd'

export default function ContactPage() {
  return (
    <section className="container section" style={{ maxWidth: 820 }}>
      <div className="breadcrumb mb-4"><Link href="/">Accueil</Link><Icon name="chevron-right" /><span>Contact</span></div>
      <h1 className="h1 mb-4">Nous contacter</h1>
      <p className="text-2 mb-6" style={{ fontSize: 15 }}>Une question sur un rendez-vous, un paiement ou votre compte ? Écrivez-nous, nous répondons sous 24 heures ouvrables.</p>
      <div className="grid-2">
        <div className="diff-card">
          <div className="diff-icon"><Icon name="mail" /></div>
          <h3 className="h3 mb-2">Par e-mail</h3>
          <p className="text-2 mb-4">Indiquez la référence de votre rendez-vous (MGA-…) si votre question le concerne.</p>
          <a className="btn btn-primary" href={`mailto:${CONTACT_EMAIL}`}><Icon name="send" /> {CONTACT_EMAIL}</a>
        </div>
        <div className="diff-card">
          <div className="diff-icon"><Icon name="circle-alert" /></div>
          <h3 className="h3 mb-2">Urgence médicale</h3>
          <p className="text-2">MONGANGA ne traite pas les urgences. Rendez-vous immédiatement à l’hôpital le plus proche.</p>
        </div>
      </div>
      <p className="text-2" style={{ marginTop: 24, fontSize: 13 }}>Vous êtes médecin ? <Link className="auth-link" href="/inscription?type=medecin">Déposez votre candidature</Link>.</p>
    </section>
  )
}
