import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon, type IconName } from '@/components/ui/icon'

export const metadata: Metadata = { title: 'Comment ça marche' }

const STEPS: { icon: IconName; title: string; text: string; points: string[] }[] = [
  { icon: 'user-plus', title: 'Créez votre compte', text: 'Une adresse e-mail et un mot de passe suffisent. Le téléphone et la photo sont facultatifs.', points: ['Inscription en une minute', 'Lien de confirmation par e-mail', 'Données protégées'] },
  { icon: 'search', title: 'Trouvez votre médecin', text: 'Filtrez par spécialité, commune ou disponibilité. Chaque médecin affiche son tarif et ses prochains créneaux.', points: ['Médecins vérifiés par notre équipe', 'Tarif visible avant de réserver', 'Créneaux de 30 minutes'] },
  { icon: 'calendar-check', title: 'Réservez avec un acompte de 1 $', text: 'L’acompte bloque votre créneau et il est déduit du tarif du médecin. Annulation gratuite plus de 24 h avant.', points: ['M-Pesa, Orange Money, Airtel Money', 'Carte Visa ou Mastercard', 'Confirmation par e-mail'] },
  { icon: 'video', title: 'Consultez en visio', text: 'Le jour J, réglez le solde à partir d’une heure avant, puis rejoignez votre médecin en vidéo pendant 30 minutes.', points: ['Passage en audio si le réseau faiblit', 'Messages et envoi de documents', 'Ordonnance numérique vérifiable'] },
]

export default function CommentPage() {
  return (
    <>
      <section className="container section">
        <div className="breadcrumb mb-4"><Link href="/">Accueil</Link><Icon name="chevron-right" /><span>Comment ça marche</span></div>
        <h1 className="h1 mb-4">Comment ça marche</h1>
        <p className="text-2" style={{ fontSize: 16, maxWidth: 680 }}>
          MONGANGA simplifie l’accès aux soins à Kinshasa. En quatre étapes, consultez un médecin vérifié depuis votre téléphone.
        </p>
      </section>
      <section className="container" style={{ paddingBottom: 72 }}>
        <div className="steps-detail">
          {STEPS.map((s, i) => (
            <div className="step-detail" key={s.title}>
              <div className="step-badge">{i + 1}</div>
              <div className="step-content">
                <div className="step-ico"><Icon name={s.icon} /></div>
                <h2 className="h3 mb-2">{s.title}</h2>
                <p className="text-2 mb-4">{s.text}</p>
                <ul className="feature-list">
                  {s.points.map((p) => <li key={p}><Icon name="circle-check" /> {p}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section section-alt">
        <div className="container">
          <div className="callout-grid grid-2">
            <div className="diff-card">
              <div className="diff-icon"><Icon name="circle-alert" /></div>
              <h3 className="h3 mb-2">En cas d’urgence</h3>
              <p className="text-2">MONGANGA ne remplace pas les urgences. Pour une douleur intense, une difficulté à respirer ou une perte de connaissance, rendez-vous immédiatement à l’hôpital le plus proche.</p>
            </div>
            <div className="diff-card">
              <div className="diff-icon"><Icon name="lock" /></div>
              <h3 className="h3 mb-2">Votre vie privée</h3>
              <p className="text-2">Seul votre médecin voit votre consultation. Ordonnances, documents et messages sont supprimés 30 jours après la consultation.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="cta-final">
          <h2 className="h1 mb-2" style={{ color: 'inherit' }}>Prêt à essayer ?</h2>
          <p style={{ opacity: 0.85, marginBottom: 28 }}>Créez votre compte et réservez votre première consultation.</p>
          <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Link className="btn btn-primary btn-lg" href="/inscription">Créer un compte</Link>
            <Link className="btn btn-secondary btn-lg" href="/medecins">Voir les médecins</Link>
          </div>
        </div>
      </section>
    </>
  )
}
