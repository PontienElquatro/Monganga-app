import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { EMAILS, mailto, type EmailBox } from '@/lib/contact'

export const metadata: Metadata = { title: 'Contact' }

const CHANNELS: { box: EmailBox; icon: 'mail' | 'lock' | 'wallet'; title: string; text: string }[] = [
  { box: 'contact', icon: 'mail', title: 'Questions générales', text: 'Informations sur MONGANGA, partenariats, candidatures de médecins, presse, données personnelles.' },
  { box: 'support', icon: 'lock', title: 'Aide technique et compte', text: 'Connexion, mot de passe, inscription, visio qui ne fonctionne pas. Joignez une capture d’écran si possible.' },
  { box: 'sav', icon: 'wallet', title: 'Paiements et remboursements', text: 'Paiement non confirmé, remboursement, annulation, réclamation après une consultation, versements aux médecins.' },
]

export default function ContactPage() {
  return (
    <section className="container section" style={{ maxWidth: 820 }}>
      <div className="breadcrumb mb-4"><Link href="/">Accueil</Link><Icon name="chevron-right" /><span>Contact</span></div>
      <h1 className="h1 mb-4">Nous contacter</h1>
      <p className="text-2 mb-6" style={{ fontSize: 15 }}>Une question sur un rendez-vous, un paiement ou votre compte ? Choisissez l’adresse qui correspond à votre demande : nous répondons sous 24 heures ouvrables. Indiquez la référence de votre rendez-vous (MGA-…) si votre question le concerne.</p>
      <div className="grid-2">
        {CHANNELS.map((c) => (
          <div className="diff-card" key={c.box}>
            <div className="diff-icon"><Icon name={c.icon} /></div>
            <h3 className="h3 mb-2">{c.title}</h3>
            <p className="text-2 mb-4">{c.text}</p>
            <a className="btn btn-primary" href={mailto(c.box)}><Icon name="send" /> {EMAILS[c.box]}</a>
          </div>
        ))}
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
