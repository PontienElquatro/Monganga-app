import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { AppointmentBadge, Badge } from '@/components/ui/status'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { RdvCard } from '@/components/patient/rdv-card'
import { CancelForm } from '@/components/patient/cancel-form'
import { RatingForm } from '@/components/patient/rating-form'
import { getPatientAppointments, getTiming } from '@/lib/patient'
import { canCancel, cancelConsequence, isUpcoming, patientStep, refundLine } from '@/lib/appointments'
import { usd } from '@/lib/format'
import type { PatientAppointment } from '@/lib/types'

export const metadata: Metadata = { title: 'Mes rendez-vous' }

export default async function RendezVousPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams
  const [all, timing] = await Promise.all([getPatientAppointments(), getTiming()])
  const now = Date.now()
  const upcoming = all.filter((a) => isUpcoming(a, now)).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  // Les réservations expirées sans paiement n'intéressent pas le patient : on les masque.
  const past = all.filter((a) => !isUpcoming(a, now) && a.status !== 'expiree' && !(a.status === 'en_attente_acompte'))
  const showPast = vue === 'passes'
  const list = showPast ? past : upcoming

  return (
    <>
      <PageHeading title="Mes rendez-vous" description="Vos consultations à venir et passées, avec l’état de chaque paiement."
                   actions={<Link className="btn btn-primary" href="/patient/recherche"><Icon name="plus" /> Nouveau rendez-vous</Link>} />
      <nav className="v3-tabs" aria-label="Filtrer les rendez-vous">
        <Link className={!showPast ? 'active' : ''} href="/patient/rendez-vous" aria-current={!showPast ? 'page' : undefined}>À venir ({upcoming.length})</Link>
        <Link className={showPast ? 'active' : ''} href="/patient/rendez-vous?vue=passes" aria-current={showPast ? 'page' : undefined}>Passés ({past.length})</Link>
      </nav>
      {list.length ? (
        <div className="booking-list">
          {list.map((a) => (showPast ? <PastBooking key={a.id} a={a} /> : <UpcomingBooking key={a.id} a={a} timing={timing} now={now} />))}
        </div>
      ) : showPast ? (
        <EmptyState icon="calendar" title="Aucune consultation passée" text="Vos consultations terminées apparaîtront ici, avec vos ordonnances." />
      ) : (
        <EmptyState icon="calendar" title="Aucun rendez-vous à venir" text="Réservez une consultation en visio avec un médecin vérifié."
                    action={<Link className="btn btn-primary" href="/patient/recherche"><Icon name="search" /> Trouver un médecin</Link>} />
      )}
    </>
  )
}

function UpcomingBooking({ a, timing, now }: { a: PatientAppointment; timing: Awaited<ReturnType<typeof getTiming>>; now: number }) {
  const step = patientStep(a, timing, now)
  const balance = a.fee_cents - a.deposit_cents
  return (
    <article className="panel v3-booking">
      <RdvCard a={a} extra={step.badge ? <Badge tone={step.badge.tone}>{step.badge.label}</Badge> : <AppointmentBadge status={a.status} />} />
      <div className="v3-pay-line">
        <span><Icon name={a.status === 'en_attente_acompte' ? 'clock' : 'check'} /> Acompte · {usd(a.deposit_cents)}{a.status === 'en_attente_acompte' ? ' — à payer' : ' — payé'}</span>
        <span><Icon name={a.balance_paid_at ? 'check' : 'clock'} /> Solde · {usd(balance)}{a.balance_paid_at ? ' — payé' : ' — le jour de la visio'}</span>
      </div>
      <div className="actions">
        {step.href ? <Link className="btn btn-primary" href={step.href}><Icon name={step.icon} /> {step.label}</Link> : null}
        {canCancel(a, now) ? <CancelForm appointmentId={a.id} consequence={cancelConsequence(a, timing, now)} /> : null}
      </div>
      {step.hint ? <p className="meta">{step.hint}</p> : null}
      <p className="meta">Référence {a.reference}</p>
    </article>
  )
}

function PastBooking({ a }: { a: PatientAppointment }) {
  const refund = refundLine(a)
  const override = a.refund_status ? { label: a.refund_status === 'effectue' ? 'Remboursé' : 'Remboursement en cours', tone: 'refund' } : undefined
  return (
    <article className="panel v3-booking">
      <RdvCard a={a} extra={<AppointmentBadge status={a.status} override={override} />} />
      {a.status === 'annulee_medecin' || a.status === 'absence_medecin' ? (
        <p className="meta">{a.status === 'annulee_medecin' ? 'Annulé par le médecin' : 'Le médecin ne s’est pas présenté'} · vous êtes remboursé de tout ce que vous avez payé.{a.cancel_reason ? ` Motif : ${a.cancel_reason}` : ''}</p>
      ) : null}
      {a.status === 'absence_patient' ? <p className="meta">Absence constatée : l’acompte reste acquis, comme prévu dans les conditions.</p> : null}
      {refund ? <p className="meta"><Icon name="banknote" /> {refund}</p> : null}
      {a.status === 'terminee' ? (
        <>
          {a.has_prescription ? <div className="actions"><Link className="btn btn-secondary" href="/patient/ordonnances"><Icon name="file-text" /> Voir l’ordonnance</Link></div> : null}
          {a.has_rating ? <p className="meta"><Icon name="circle-check" /> Merci, votre avis a bien été transmis.</p> : <RatingForm appointmentId={a.id} />}
        </>
      ) : null}
      <p className="meta">Référence {a.reference}</p>
    </article>
  )
}
