import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/status'
import { ActionForm } from '@/components/ui/action-form'
import { SubmitButton } from '@/components/ui/form'
import { PageHeading } from '@/components/ui/page-heading'
import { createClient } from '@/lib/supabase/server'
import { markRefundDoneAction, resolveAppointmentAction } from '@/app/admin/actions'
import { dateTime, fullName, paymentLabel, usd } from '@/lib/format'
import type { PaymentKind, PaymentMethod, PaymentStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Transactions' }

type Person = { first_name: string; last_name: string; email: string }
interface PaymentRow {
  id: string; kind: PaymentKind; amount_cents: number; method: PaymentMethod; phone: string | null; provider: string; provider_ref: string | null
  status: PaymentStatus; failure_reason: string | null; created_at: string
  profiles: Person; appointments: { reference: string }
}
interface RefundRow { id: string; amount_cents: number; reason: string; created_at: string; payments: { method: PaymentMethod; phone: string | null; provider_ref: string | null; profiles: Person }; appointments: { reference: string } }
interface ExamRow { id: string; reference: string; starts_at: string; patient_joined_at: string | null; doctor_joined_at: string | null; balance_paid_at: string | null; patient: Person; doctor: { profiles: Person } }

const STATUS: Record<PaymentStatus, { label: string; tone: string }> = {
  en_attente: { label: 'En attente', tone: 'pending' },
  reussi: { label: 'Réussi', tone: 'paid' },
  echoue: { label: 'Échoué', tone: 'failed' },
  annule: { label: 'Annulé', tone: 'neutral' },
}

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams
  const supabase = await createClient()
  let payQuery = supabase.from('payments')
    .select('id, kind, amount_cents, method, phone, provider, provider_ref, status, failure_reason, created_at, profiles!inner(first_name, last_name, email), appointments!inner(reference)')
    .order('created_at', { ascending: false }).limit(200)
  if (statut && statut in STATUS) payQuery = payQuery.eq('status', statut)
  const [{ data: pays }, { data: refunds }, { data: exam }] = await Promise.all([
    payQuery,
    supabase.from('refunds')
      .select('id, amount_cents, reason, created_at, payments!inner(method, phone, provider_ref, profiles!inner(first_name, last_name, email)), appointments!inner(reference)')
      .eq('status', 'a_traiter').order('created_at'),
    supabase.from('appointments')
      .select('id, reference, starts_at, patient_joined_at, doctor_joined_at, balance_paid_at, patient:profiles!appointments_patient_id_fkey(first_name, last_name, email), doctor:doctor_profiles!appointments_doctor_id_fkey(profiles!doctor_profiles_id_fkey(first_name, last_name, email))')
      .eq('status', 'a_examiner').order('starts_at'),
  ])
  const payments = (pays ?? []) as unknown as PaymentRow[]
  const toRefund = (refunds ?? []) as unknown as RefundRow[]
  const toExamine = (exam ?? []) as unknown as ExamRow[]

  return (
    <>
      <PageHeading space="Administration" title="Transactions" description="Paiements reçus, remboursements à effectuer et rendez-vous à trancher." />

      <section className="panel stack mb-6" id="remboursements">
        <h2>Remboursements à effectuer ({toRefund.length})</h2>
        {toRefund.length ? toRefund.map((r) => (
          <div key={r.id} className="agenda-row">
            <div className="person"><div><strong>{usd(r.amount_cents)} à {fullName(r.payments.profiles)}</strong>
              <span className="meta">{paymentLabel(r.payments.method)}{r.payments.phone ? ` · ${r.payments.phone}` : ''} · RDV {r.appointments.reference} · {r.reason}</span>
              <span className="meta">Paiement d’origine : {r.payments.provider_ref ?? '—'} · demandé le {dateTime(r.created_at)}</span></div></div>
            <ActionForm action={markRefundDoneAction} className="inline-form" hideOnSuccess>
              <input type="hidden" name="refund_id" value={r.id} />
              <input className="form-input" name="reference" placeholder="Référence du remboursement" required maxLength={100} aria-label="Référence du remboursement" />
              <SubmitButton className="btn btn-primary btn-sm" icon="check">Marquer remboursé</SubmitButton>
            </ActionForm>
          </div>
        )) : <p className="meta">Aucun remboursement en attente.</p>}
        <p className="meta"><Icon name="info" /> Tant que l’API de paiement ne gère pas les remboursements automatiques, effectuez-les depuis le compte marchand puis notez la référence ici.</p>
      </section>

      <section className="panel stack mb-6" id="a-examiner">
        <h2>Rendez-vous à trancher ({toExamine.length})</h2>
        {toExamine.length ? toExamine.map((a) => (
          <div key={a.id} className="agenda-row">
            <div className="person"><div><strong>{a.reference} · {dateTime(a.starts_at)}</strong>
              <span className="meta">Patient : {fullName(a.patient)} — {a.patient_joined_at ? `connecté à ${dateTime(a.patient_joined_at)}` : 'jamais connecté'}{a.balance_paid_at ? ', solde payé' : ', solde non payé'}</span>
              <span className="meta">Médecin : {fullName(a.doctor.profiles)} — {a.doctor_joined_at ? `connecté à ${dateTime(a.doctor_joined_at)}` : 'jamais connecté'}</span></div></div>
            <ActionForm action={resolveAppointmentAction} className="inline-form" hideOnSuccess>
              <input type="hidden" name="appointment_id" value={a.id} />
              <select className="form-input" name="decision" required defaultValue="" aria-label="Décision">
                <option value="" disabled>Décision…</option>
                <option value="terminee">Consultation faite (payer le médecin)</option>
                <option value="absence_patient">Patient absent (acompte partagé 70/30)</option>
                <option value="absence_medecin">Médecin absent (tout rembourser)</option>
              </select>
              <SubmitButton className="btn btn-primary btn-sm" icon="check">Appliquer</SubmitButton>
            </ActionForm>
          </div>
        )) : <p className="meta">Aucun rendez-vous à trancher.</p>}
      </section>

      <section className="panel stack">
        <div className="card-header-row">
          <h2>Paiements</h2>
          <nav className="v3-tabs" aria-label="Filtrer les paiements">
            <Link className={!statut ? 'active' : ''} href="/admin/transactions">Tous</Link>
            {Object.entries(STATUS).map(([k, v]) => <Link key={k} className={statut === k ? 'active' : ''} href={`/admin/transactions?statut=${k}`}>{v.label}</Link>)}
          </nav>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Patient</th><th>RDV</th><th>Type</th><th>Montant</th><th>Moyen</th><th>Référence</th><th>État</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{dateTime(p.created_at)}</td>
                  <td><span className="table-name">{fullName(p.profiles)}</span><span className="table-sub">{p.profiles.email}</span></td>
                  <td>{p.appointments.reference}</td>
                  <td>{p.kind === 'acompte' ? 'Acompte' : 'Solde'}</td>
                  <td><strong>{usd(p.amount_cents)}</strong></td>
                  <td>{paymentLabel(p.method)}{p.phone ? <span className="table-sub">{p.phone}</span> : null}</td>
                  <td><span className="table-sub">{p.provider}</span>{p.provider_ref ?? '—'}</td>
                  <td><Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>{p.failure_reason ? <span className="table-sub">{p.failure_reason}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!payments.length ? <p className="meta">Aucun paiement.</p> : null}
      </section>
    </>
  )
}
