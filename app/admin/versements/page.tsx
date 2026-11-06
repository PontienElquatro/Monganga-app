import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/status'
import { ActionForm } from '@/components/ui/action-form'
import { SubmitButton } from '@/components/ui/form'
import { PageHeading } from '@/components/ui/page-heading'
import { createClient } from '@/lib/supabase/server'
import { nextSaturday } from '@/lib/doctor'
import { markPayoutPaidAction, preparePayoutsAction } from '@/app/admin/actions'
import { dateLong, dateShort, doctorName, payoutLabel, usd } from '@/lib/format'
import type { PayoutMethod } from '@/lib/types'

export const metadata: Metadata = { title: 'Versements' }

interface Row {
  id: string; period_end: string; amount_cents: number; fees_cents: number; net_cents: number; method: PayoutMethod; account: string
  status: 'a_verser' | 'verse'; reference: string | null; paid_at: string | null
  doctor_profiles: { title: string; payout_holder: string | null; profiles: { first_name: string; last_name: string } }
}

export default async function VersementsPage() {
  const supabase = await createClient()
  const [{ data }, { data: unpaid }] = await Promise.all([
    supabase.from('payouts')
      .select('id, period_end, amount_cents, fees_cents, net_cents, method, account, status, reference, paid_at, doctor_profiles!inner(title, payout_holder, profiles!doctor_profiles_id_fkey(first_name, last_name))')
      .order('period_end', { ascending: false }).limit(300),
    supabase.from('ledger_entries').select('amount_cents').eq('type', 'part_medecin').is('payout_id', null),
  ])
  const rows = (data ?? []) as unknown as Row[]
  const todo = rows.filter((r) => r.status === 'a_verser')
  const done = rows.filter((r) => r.status === 'verse')
  const waiting = ((unpaid ?? []) as { amount_cents: number }[]).reduce((s, r) => s + r.amount_cents, 0)
  const saturday = nextSaturday()
  const name = (r: Row) => doctorName({ title: r.doctor_profiles.title, ...r.doctor_profiles.profiles })

  return (
    <>
      <PageHeading space="Administration" title="Versements aux médecins" description="Chaque samedi soir : la part de chaque médecin, par son moyen préféré, frais de transfert déduits." />
      <div className="layout-two mb-6">
        <section className="panel stack">
          <h2>1. Préparer les versements</h2>
          <p>Part des médecins pas encore versée : <strong>{usd(waiting)}</strong></p>
          <ActionForm action={preparePayoutsAction}>
            <div className="field"><label htmlFor="period_end">Inclure les consultations jusqu’au</label>
              <input className="form-input" id="period_end" name="period_end" type="date" defaultValue={saturday} required /></div>
            <SubmitButton icon="hand-coins">Préparer les versements</SubmitButton>
          </ActionForm>
          <p className="meta">Regroupe, par médecin, sa part non versée jusqu’à cette date (incluse). Vous pouvez relancer : rien n’est compté deux fois.</p>
        </section>
        <section className="panel stack">
          <h2>2. Envoyer puis confirmer</h2>
          <p className="meta">Faites le transfert depuis le compte marchand (Mobile Money ou banque) vers le compte indiqué, puis saisissez les frais réellement prélevés et la référence. Le médecin est prévenu par e-mail.</p>
          <p className="notice"><Icon name="info" /> Prochain samedi : {dateLong(`${saturday}T12:00:00+01:00`)}.</p>
        </section>
      </div>

      <section className="panel stack mb-6">
        <h2>À verser ({todo.length})</h2>
        {todo.length ? todo.map((r) => (
          <div key={r.id} className="agenda-row">
            <div className="person"><div><strong>{name(r)} · {usd(r.amount_cents)}</strong>
              <span className="meta">{payoutLabel(r.method)} · <span className="mono">{r.account}</span>{r.doctor_profiles.payout_holder ? ` · titulaire : ${r.doctor_profiles.payout_holder}` : ''}</span>
              <span className="meta">Période jusqu’au {dateShort(`${r.period_end}T12:00:00+01:00`)}</span></div></div>
            <ActionForm action={markPayoutPaidAction} className="inline-form" hideOnSuccess>
              <input type="hidden" name="payout_id" value={r.id} />
              <input className="form-input" name="fees" inputMode="decimal" placeholder="Frais ($)" aria-label="Frais de transfert en dollars" style={{ width: 100 }} />
              <input className="form-input" name="reference" placeholder="Référence du transfert" required maxLength={100} aria-label="Référence du transfert" />
              <SubmitButton className="btn btn-primary btn-sm" icon="check">Versé</SubmitButton>
            </ActionForm>
          </div>
        )) : <p className="meta">Aucun versement en attente.</p>}
      </section>

      <section className="panel stack">
        <h2>Historique</h2>
        {done.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Médecin</th><th>Période</th><th>Montant</th><th>Frais</th><th>Net versé</th><th>Moyen</th><th>Référence</th></tr></thead>
              <tbody>
                {done.map((r) => (
                  <tr key={r.id}>
                    <td>{name(r)}</td>
                    <td>{dateShort(`${r.period_end}T12:00:00+01:00`)}</td>
                    <td>{usd(r.amount_cents)}</td>
                    <td>{usd(r.fees_cents)}</td>
                    <td><strong>{usd(r.net_cents)}</strong></td>
                    <td>{payoutLabel(r.method)}</td>
                    <td>{r.reference}<span className="table-sub">{r.paid_at ? dateShort(r.paid_at) : ''}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="meta">Aucun versement effectué pour l’instant.</p>}
      </section>
      <Badge tone="neutral">Les montants sont en dollars américains (USD).</Badge>
    </>
  )
}
