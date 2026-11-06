import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/status'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { requireRole } from '@/lib/auth'
import { getEarnings, nextSaturday } from '@/lib/doctor'
import { dateLong, dateShort, dayKey, kinMonthStart, maskAccount, payoutLabel, usd } from '@/lib/format'
import type { PayoutMethod } from '@/lib/types'

export const metadata: Metadata = { title: 'Revenus' }

const REASON: Record<string, string> = {
  consultation: 'Consultation',
  absence_patient: 'Patient absent (part de l’acompte)',
  annulation_tardive: 'Annulation tardive (part de l’acompte)',
}

export default async function RevenusPage() {
  const session = await requireRole('medecin')
  const { ledger, payouts } = await getEarnings()
  const month = kinMonthStart()
  const monthCents = ledger.filter((l) => dayKey(l.created_at) >= month).reduce((s, l) => s + l.amount_cents, 0)
  const unpaid = ledger.filter((l) => !l.payout_id).reduce((s, l) => s + l.amount_cents, 0)
  const prepared = payouts.filter((p) => p.status === 'a_verser').reduce((s, p) => s + p.amount_cents, 0)
  const paidTotal = payouts.filter((p) => p.status === 'verse').reduce((s, p) => s + p.net_cents, 0)
  const doctor = session.doctor!

  return (
    <>
      <PageHeading space="Espace médecin" title="Revenus" description="Votre part de chaque consultation. Versement chaque samedi soir, frais de transfert déduits." />
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        <div className="kpi-card"><div className="kpi-label"><Icon name="wallet" /> Ma part ce mois</div><div className="kpi-value">{usd(monthCents)}</div></div>
        <div className="kpi-card"><div className="kpi-label"><Icon name="hand-coins" /> Prochain versement</div><div className="kpi-value">{usd(unpaid + prepared)}</div><span className="kpi-trend up">{dateLong(`${nextSaturday()}T12:00:00+01:00`)}</span></div>
        <div className="kpi-card"><div className="kpi-label"><Icon name="banknote" /> Déjà versé</div><div className="kpi-value">{usd(paidTotal)}</div><span className="kpi-trend up">net de frais</span></div>
        <div className="kpi-card"><div className="kpi-label"><Icon name={doctor.payout_method === 'banque' ? 'landmark' : 'smartphone'} /> Compte</div><div className="kpi-value kpi-small">{payoutLabel(doctor.payout_method as PayoutMethod)}</div><span className="kpi-trend up">{maskAccount(doctor.payout_account)}</span></div>
      </div>

      <section className="panel stack mb-6">
        <h2>Versements</h2>
        {payouts.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Semaine se terminant le</th><th>Montant</th><th>Frais</th><th>Net</th><th>Moyen</th><th>État</th></tr></thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td>{dateShort(`${p.period_end}T12:00:00+01:00`)}</td>
                    <td>{usd(p.amount_cents)}</td>
                    <td>{p.status === 'verse' ? usd(p.fees_cents) : '—'}</td>
                    <td><strong>{p.status === 'verse' ? usd(p.net_cents) : '—'}</strong></td>
                    <td>{payoutLabel(p.method as PayoutMethod)} · {maskAccount(p.account)}</td>
                    <td>{p.status === 'verse' ? <Badge tone="paid">Versé{p.paid_at ? ` le ${dateShort(p.paid_at)}` : ''}</Badge> : <Badge tone="pending">À verser</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="meta">Aucun versement pour l’instant. Le premier aura lieu le samedi suivant votre première consultation.</p>}
      </section>

      <section className="panel stack">
        <h2>Détail de ma part</h2>
        {ledger.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Motif</th><th>Ma part</th><th>Versement</th></tr></thead>
              <tbody>
                {ledger.map((l) => (
                  <tr key={l.id}>
                    <td>{dateShort(l.created_at)}</td>
                    <td>{REASON[l.reason] ?? l.reason}</td>
                    <td><strong>{usd(l.amount_cents)}</strong></td>
                    <td>{l.payout_id ? 'Inclus' : 'Samedi prochain'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon="wallet" title="Pas encore de revenus" text="Votre part apparaît ici dès la fin de chaque consultation." />}
      </section>
    </>
  )
}
