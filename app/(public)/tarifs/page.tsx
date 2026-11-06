import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'

export const metadata: Metadata = { title: 'Tarifs' }

export default function TarifsPage() {
  return (
    <>
      <section className="container section text-center">
        <div className="breadcrumb" style={{ justifyContent: 'center', marginBottom: 16 }}><Link href="/">Accueil</Link><Icon name="chevron-right" /><span>Tarifs</span></div>
        <h1 className="h1 mb-4">Comment fonctionnent les tarifs</h1>
        <p className="text-2 mx-auto" style={{ fontSize: 15, maxWidth: 640 }}>
          Chaque médecin fixe le tarif de sa consultation selon sa spécialité. Vous le voyez sur son profil avant de réserver : pas de surprise, pas de frais cachés.
        </p>
      </section>
      <section className="container" style={{ paddingBottom: 40 }}>
        <div className="v3-howpay">
          <article><span className="v3-howpay-n">1</span><div className="v3-howpay-icon"><Icon name="search" /></div><h3>Vous choisissez un médecin</h3><p>Son tarif est affiché sur son profil, avant toute réservation. Il dépend de sa spécialité.</p></article>
          <article className="rdc"><span className="v3-howpay-n">2</span><div className="v3-howpay-icon"><Icon name="calendar-check" /></div><h3>Un petit acompte réserve le créneau</h3><p>Il est déduit du tarif du médecin. Annulation plus de 24 h avant : il vous est remboursé.</p></article>
          <article><span className="v3-howpay-n">3</span><div className="v3-howpay-icon"><Icon name="video" /></div><h3>Le solde, juste avant la visio</h3><p>Le jour J, réglez le reste dès l’heure qui précède, ou au moment de cliquer sur « Démarrer ».</p></article>
        </div>
        <div className="alert info" style={{ maxWidth: 720, margin: '28px auto 0' }}>
          <Icon name="info" />
          <span>Toutes les consultations durent 30 minutes. Si le médecin annule ou ne se présente pas, vous êtes remboursé intégralement.</span>
        </div>
      </section>
      <section className="container section">
        <h2 className="h2 text-center mb-8">Moyens de paiement acceptés</h2>
        <div className="payment-methods-grid">
          {[['M-Pesa', '/images/paiement/mpesa.png'], ['Orange Money', '/images/paiement/orange-money.png'], ['Airtel Money', '/images/paiement/airtel-money.png']].map(([name, logo]) => (
            <div className="payment-card" key={name}>
              <div className="payment-icon"><img src={logo} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} /></div>
              <h4 className="h4 mb-2">{name}</h4>
              <p className="text-2" style={{ fontSize: 12 }}>Validation sur votre téléphone</p>
            </div>
          ))}
          <div className="payment-card">
            <div className="payment-icon"><Icon name="credit-card" /></div>
            <h4 className="h4 mb-2">Carte bancaire</h4>
            <p className="text-2" style={{ fontSize: 12 }}>Visa · Mastercard</p>
          </div>
        </div>
      </section>
    </>
  )
}
