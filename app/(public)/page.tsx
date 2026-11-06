import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

export default function AccueilPage() {
  return (
    <>
      <section className="container">
        <div className="hero">
          <div className="slide-in-left">
            <h1 className="hero-title">Monganga na yo,<br /><em>na tshombo na yo</em></h1>
            <p className="hero-desc">
              Consultez un médecin vérifié depuis chez vous, sans vous déplacer. La santé à portée de main, à Kinshasa.
            </p>
            <div className="hero-cta">
              <Link className="btn btn-primary btn-lg" href="/medecins"><Icon name="video" /> Trouver un médecin</Link>
              <Link className="btn btn-secondary btn-lg" href="/comment-ca-marche"><Icon name="circle-play" /> Comment ça marche</Link>
            </div>
            <div className="hero-trust">
              <span><Icon name="shield-check" /> Médecins vérifiés</span>
              <span><Icon name="smartphone" /> Mobile Money</span>
              <span><Icon name="lock" /> Données protégées</span>
            </div>
          </div>
          <div className="hero-visual slide-in-right">
            <img className="hero-visual-image" src="/images/doctor-teleconsultation.webp" alt="Médecin en téléconsultation avec une patiente"
                 width={1600} height={1067} fetchPriority="high" decoding="async" />
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <h2 className="h2 text-center mb-8">Comment ça marche ?</h2>
          <div className="steps-grid">
            {[
              ['search', 'Étape 1', 'Trouvez un médecin', 'Par spécialité, commune ou disponibilité. Son tarif est affiché sur son profil.'],
              ['calendar-check', 'Étape 2', 'Réservez avec 1 $', 'Un petit acompte bloque votre créneau. Il est déduit du tarif.'],
              ['credit-card', 'Étape 3', 'Réglez le solde le jour J', 'En Mobile Money ou par carte, juste avant la visio.'],
              ['file-text', 'Étape 4', 'Consultez et recevez l’ordonnance', '30 minutes en visio, puis votre ordonnance numérique.'],
            ].map(([icon, num, title, desc]) => (
              <div className="step-card" key={num}>
                <div className="step-icon"><Icon name={icon as 'search'} /></div>
                <div className="step-num">{num}</div>
                <div className="step-title">{title}</div>
                <div className="step-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="h2 text-center mb-8">Pourquoi MONGANGA ?</h2>
          <div className="grid-2">
            <div className="diff-card">
              <div className="diff-icon"><Icon name="wifi-off" /></div>
              <h3 className="h3 mb-2">Connexion instable ? Passez en audio</h3>
              <p className="text-2">Coupez la caméra pendant l’appel pour économiser vos données, sans interrompre la consultation.</p>
            </div>
            <div className="diff-card">
              <div className="diff-icon"><Icon name="qr-code" /></div>
              <h3 className="h3 mb-2">Votre ordonnance, toujours avec vous</h3>
              <p className="text-2">Une ordonnance numérique vérifiable par QR code, à montrer en pharmacie. Plus besoin d’imprimer.</p>
            </div>
            <div className="diff-card">
              <div className="diff-icon"><Icon name="badge-check" /></div>
              <h3 className="h3 mb-2">Des médecins vérifiés</h3>
              <p className="text-2">Diplôme, inscription à l’Ordre des médecins et identité contrôlés avant toute consultation.</p>
            </div>
            <div className="diff-card">
              <div className="diff-icon"><Icon name="heart-handshake" /></div>
              <h3 className="h3 mb-2">Des règles claires</h3>
              <p className="text-2">Annulation plus de 24 h avant : acompte remboursé. Médecin absent : vous êtes remboursé de tout.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '0 24px 72px' }}>
        <div className="cta-final">
          <h2 className="h1 mb-2" style={{ color: 'inherit' }}>Prêt à consulter un médecin ?</h2>
          <p style={{ opacity: 0.85, marginBottom: 28 }}>Créez votre compte en une minute et prenez votre premier rendez-vous.</p>
          <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Link className="btn btn-primary btn-lg" href="/inscription">Créer un compte</Link>
            <Link className="btn btn-secondary btn-lg" href="/medecins">Voir les médecins</Link>
          </div>
        </div>
      </section>
    </>
  )
}
