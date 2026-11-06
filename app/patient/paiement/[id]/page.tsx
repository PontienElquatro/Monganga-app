import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/status'
import { AutoRefresh } from '@/components/ui/auto-refresh'
import { PageHeading } from '@/components/ui/page-heading'
import { RdvCard } from '@/components/patient/rdv-card'
import { PayForm } from '@/components/payment/pay-form'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getPatientAppointment, getTiming } from '@/lib/patient'
import { dateShort, paymentLabel, time, usd } from '@/lib/format'
import { startPaymentAction } from '@/app/patient/actions'
import type { PaymentKind, PaymentMethod, PaymentStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Paiement' }

interface PaymentRow { id: string; kind: PaymentKind; status: PaymentStatus; method: PaymentMethod; amount_cents: number; paid_at: string | null; failure_reason: string | null }

const MIN = 60_000

function Step({ state, title, text }: { state: '' | 'done' | 'current'; title: string; text: string }) {
  return (
    <li className={`v3-step ${state}`}>
      <span className="v3-step-dot">{state === 'done' ? <Icon name="check" /> : state === 'current' ? <Icon name="loader" /> : null}</span>
      <div><strong>{title}</strong><p>{text}</p></div>
    </li>
  )
}

export default async function PaiementPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ etape?: string; retour?: string; attente?: string; etat?: string }>
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const session = await requireRole('patient')
  const a = await getPatientAppointment(id)
  if (!a) notFound()
  const timing = await getTiming()
  const supabase = await createClient()
  const { data: payRows } = await supabase
    .from('payments')
    .select('id, kind, status, method, amount_cents, paid_at, failure_reason')
    .eq('appointment_id', a.id)
    .order('created_at', { ascending: false })
  const payments = (payRows ?? []) as PaymentRow[]
  const deposit = payments.find((p) => p.kind === 'acompte' && p.status === 'reussi')
  const balancePay = payments.find((p) => p.kind === 'solde' && p.status === 'reussi')
  const watched = payments.find((p) => p.id === (sp.attente ?? sp.retour))
  const balance = a.fee_cents - a.deposit_cents
  const now = Date.now()
  const start = new Date(a.starts_at).getTime()

  // Paiement envoyé au prestataire, confirmation pas encore reçue.
  if (watched?.status === 'en_attente') {
    return (
      <>
        <AutoRefresh seconds={4} />
        <PageHeading title="Paiement en cours de confirmation" description="Confirmez le paiement sur votre téléphone si une demande s’affiche. Cette page se met à jour toute seule." />
        <section className="panel stack v3-center">
          <Icon name="loader" className="spin" />
          <p><strong>{usd(watched.amount_cents)}</strong> via {paymentLabel(watched.method)}</p>
          <p className="meta">Si rien ne se passe après quelques minutes, revenez à vos rendez-vous et réessayez.</p>
          <Link className="btn btn-secondary" href="/patient/rendez-vous"><Icon name="calendar" /> Mes rendez-vous</Link>
        </section>
      </>
    )
  }
  const failed = watched?.status === 'echoue' || sp.etat === 'echec'
  const failNotice = failed ? (
    <p className="notice danger" role="alert"><Icon name="circle-x" /> Le paiement n’a pas abouti{watched?.failure_reason ? ` (${watched.failure_reason})` : ''}. Aucun montant n’a été débité. Vous pouvez réessayer.</p>
  ) : null

  // Réservation expirée ou plus payable.
  if (a.status === 'expiree' || (a.status === 'en_attente_acompte' && new Date(a.deposit_due_at).getTime() <= now)) {
    return (
      <>
        <PageHeading title="Réservation expirée" description="L’acompte n’a pas été payé dans les 15 minutes : le créneau a été libéré." />
        <section className="panel stack">
          <RdvCard a={a} extra={<Badge tone="neutral">Expirée</Badge>} />
          <Link className="btn btn-primary" href={`/patient/medecins/${a.doctor_id}`}><Icon name="calendar" /> Choisir un autre créneau</Link>
        </section>
      </>
    )
  }

  // Étape 1 : acompte.
  if (a.status === 'en_attente_acompte') {
    return (
      <>
        <PageHeading title="Réserver mon créneau" description={`Un acompte de ${usd(a.deposit_cents)} suffit pour bloquer le créneau. Le reste se paie le jour de la visio.`} />
        {failNotice}
        <div className="layout-two">
          <section className="panel stack">
            <RdvCard a={a} />
            <div className="v3-paysteps"><span className="current">1 Acompte {usd(a.deposit_cents)}</span><span>2 Solde {usd(balance)}</span><span>3 Visio</span></div>
            <div className="v3-summary">
              <div><span>Tarif fixé par le médecin</span><strong>{usd(a.fee_cents)}</strong></div>
              <div className="total"><span>À payer maintenant (acompte)</span><strong>{usd(a.deposit_cents)}</strong></div>
              <div><span>Reste à payer le jour de la visio</span><strong>{usd(balance)}</strong></div>
            </div>
            <p className="notice"><Icon name="timer" /> Créneau retenu jusqu’à {time(a.deposit_due_at)}.</p>
            <PayForm action={startPaymentAction} appointmentId={a.id} kind="acompte" amountCents={a.deposit_cents}
                     defaultPhone={session.profile.phone} cta="Payer et réserver" />
          </section>
          <aside className="panel stack">
            <h2>Règles d’annulation</h2>
            <ul className="v3-rules">
              <li><Icon name="circle-check" /> <span><strong>Plus de {timing.annulationGratuiteHeures} h avant</strong> : vous annulez, l’acompte vous est remboursé.</span></li>
              <li><Icon name="circle-alert" /> <span><strong>Moins de {timing.annulationGratuiteHeures} h avant, ou absence</strong> : l’acompte reste acquis.</span></li>
              <li><Icon name="heart-handshake" /> <span><strong>Le médecin annule ou ne vient pas</strong> : vous êtes remboursé de tout.</span></li>
            </ul>
          </aside>
        </div>
      </>
    )
  }

  const active = a.status === 'confirme' || a.status === 'en_cours'
  const opens = start - timing.ouvertureSoldeMinutes * MIN
  const tooLate = start + timing.absenceMinutes * MIN

  // Étape 2 : solde (ouvert une heure avant, jusqu'à 10 minutes après le début).
  if (active && !a.balance_paid_at && sp.etape === 'solde' && now >= opens && now <= tooLate) {
    const minutes = Math.round((start - now) / MIN)
    return (
      <>
        <PageHeading title="Payer le solde" description={minutes > 0 ? `Votre consultation commence dans ${minutes} minute${minutes > 1 ? 's' : ''}. Réglez le solde pour pouvoir démarrer.` : 'Votre consultation a commencé. Réglez le solde pour rejoindre le médecin.'} />
        {failNotice}
        <div className="layout-two">
          <section className="panel stack">
            <RdvCard a={a} />
            <div className="v3-paysteps"><span className="done"><Icon name="check" /> Acompte {usd(a.deposit_cents)}</span><span className="current">2 Solde {usd(balance)}</span><span>3 Visio</span></div>
            <div className="v3-summary">
              <div><span>Tarif fixé par le médecin</span><strong>{usd(a.fee_cents)}</strong></div>
              <div><span>Acompte déjà payé{deposit?.paid_at ? ` le ${dateShort(deposit.paid_at)}` : ''}</span><strong>− {usd(a.deposit_cents)}</strong></div>
              <div className="total"><span>Solde à payer maintenant</span><strong>{usd(balance)}</strong></div>
            </div>
            <PayForm action={startPaymentAction} appointmentId={a.id} kind="solde" amountCents={balance}
                     defaultPhone={session.profile.phone} cta="Payer et démarrer" />
          </section>
          <aside className="panel stack">
            <h2>Bon à savoir</h2>
            <ul className="v3-rules">
              <li><Icon name="timer" /> La consultation dure 30 minutes. Un avertissement apparaît 5 minutes avant la fin.</li>
              <li><Icon name="wifi-off" /> Connexion faible ? Coupez la caméra et continuez en audio, sans couper l’appel.</li>
              <li><Icon name="user-x" /> Sans paiement du solde {timing.absenceMinutes} minutes après l’heure prévue, le rendez-vous est marqué « absent » et l’acompte n’est pas remboursé.</li>
            </ul>
          </aside>
        </div>
      </>
    )
  }

  // Confirmation (après l'acompte ou le solde).
  if (active) {
    const ready = Boolean(a.balance_paid_at)
    return (
      <>
        <PageHeading title={ready ? 'Tout est réglé' : 'Rendez-vous confirmé'}
                     description={ready ? 'Le solde est payé : vous pouvez rejoindre la consultation à l’heure prévue.' : 'Votre créneau est réservé. Une confirmation vous a été envoyée par e-mail.'} />
        <div className="layout-two">
          <section className="panel stack">
            <RdvCard a={a} extra={<Badge tone="confirmed">Confirmé</Badge>} />
            <div className="v3-summary">
              <div><span>Acompte payé{deposit ? ` (${paymentLabel(deposit.method)})` : ''}</span><strong>{usd(a.deposit_cents)}</strong></div>
              {ready
                ? <div><span>Solde payé{balancePay ? ` (${paymentLabel(balancePay.method)})` : ''}</span><strong>{usd(balance)}</strong></div>
                : <div><span>Reste à payer le jour de la visio</span><strong>{usd(balance)}</strong></div>}
              <div className="muted-row"><span>Référence</span><strong>{a.reference}</strong></div>
            </div>
            <div className="actions">
              {ready
                ? <Link className="btn btn-primary" href={`/patient/consultation/${a.id}`}><Icon name="video" /> Aller à la salle d’attente</Link>
                : now >= opens && now <= tooLate
                  ? <Link className="btn btn-primary" href={`/patient/paiement/${a.id}?etape=solde`}><Icon name="credit-card" /> Payer le solde · {usd(balance)}</Link>
                  : <Link className="btn btn-primary" href="/patient/rendez-vous"><Icon name="calendar" /> Voir mes rendez-vous</Link>}
            </div>
          </section>
          <aside className="panel stack">
            <h2>Et ensuite ?</h2>
            <ol className="v3-steps">
              <Step state="done" title="Acompte payé" text="Le créneau est bloqué pour vous" />
              <Step state={ready ? 'done' : ''} title="Rappel par e-mail" text="Le jour J, une heure avant" />
              <Step state={ready ? 'done' : ''} title="Paiement du solde" text={`Dès ${time(new Date(opens).toISOString())}, ou au clic sur « Démarrer »`} />
              <Step state={ready ? 'current' : ''} title="Consultation en visio" text="30 minutes avec votre médecin" />
            </ol>
          </aside>
        </div>
      </>
    )
  }

  // Tout autre état : rien à payer.
  return (
    <>
      <PageHeading title="Aucun paiement à faire" description="Ce rendez-vous n’attend aucun paiement." />
      <section className="panel stack">
        <RdvCard a={a} />
        <Link className="btn btn-secondary" href="/patient/rendez-vous"><Icon name="calendar" /> Mes rendez-vous</Link>
      </section>
    </>
  )
}
