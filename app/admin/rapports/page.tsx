import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { PageHeading } from '@/components/ui/page-heading'
import { createClient } from '@/lib/supabase/server'
import { kinDayStart, todayKinshasa, usd } from '@/lib/format'

export const metadata: Metadata = { title: 'Rapports' }

const monthKey = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kinshasa', year: 'numeric', month: '2-digit' }).format(new Date(iso))
const monthLabel = (key: string) => new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${key}-15T00:00:00Z`))

export default async function RapportsPage() {
  const supabase = await createClient()
  const today = todayKinshasa()
  const [y, m] = today.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 6, 1)).toISOString().slice(0, 10)
  const since = kinDayStart(first)
  const [{ data: appts }, { data: ledger }, { data: refunds }] = await Promise.all([
    supabase.from('appointments').select('status, starts_at, fee_cents').gte('starts_at', since).in('status', ['terminee', 'absence_patient', 'absence_medecin', 'annulee_patient', 'annulee_medecin']),
    supabase.from('ledger_entries').select('type, amount_cents, created_at').gte('created_at', since),
    supabase.from('refunds').select('amount_cents, status, created_at').gte('created_at', since),
  ])
  const months = Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(y, m - 6 + i, 1)).toISOString().slice(0, 7)).reverse()
  const blank = () => ({ consultations: 0, chiffre: 0, plateforme: 0, medecins: 0, rembourse: 0, absences: 0, annulations: 0 })
  const stats = new Map(months.map((k) => [k, blank()]))
  for (const a of (appts ?? []) as { status: string; starts_at: string; fee_cents: number }[]) {
    const s = stats.get(monthKey(a.starts_at)); if (!s) continue
    if (a.status === 'terminee') { s.consultations++; s.chiffre += a.fee_cents }
    else if (a.status.startsWith('absence')) s.absences++
    else s.annulations++
  }
  for (const l of (ledger ?? []) as { type: string; amount_cents: number; created_at: string }[]) {
    const s = stats.get(monthKey(l.created_at)); if (!s) continue
    if (l.type === 'part_plateforme') s.plateforme += l.amount_cents; else s.medecins += l.amount_cents
  }
  for (const r of (refunds ?? []) as { amount_cents: number; created_at: string }[]) {
    const s = stats.get(monthKey(r.created_at)); if (s) s.rembourse += r.amount_cents
  }

  return (
    <>
      <PageHeading space="Administration" title="Rapports" description="Activité et répartition de l’argent sur les six derniers mois (heure de Kinshasa)."
                   actions={<>
                     <a className="btn btn-secondary" href="/api/admin/export?type=paiements"><Icon name="download" /> Paiements (CSV)</a>
                     <a className="btn btn-secondary" href="/api/admin/export?type=repartition"><Icon name="download" /> Répartition (CSV)</a>
                   </>} />
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Mois</th><th>Consultations</th><th>Montant des consultations</th><th>Part plateforme</th><th>Part médecins</th><th>Remboursements</th><th>Absences</th><th>Annulations</th></tr></thead>
          <tbody>
            {months.map((k) => {
              const s = stats.get(k)!
              return (
                <tr key={k}>
                  <td><strong>{monthLabel(k)}</strong></td>
                  <td>{s.consultations}</td>
                  <td>{usd(s.chiffre)}</td>
                  <td><strong>{usd(s.plateforme)}</strong></td>
                  <td>{usd(s.medecins)}</td>
                  <td>{usd(s.rembourse)}</td>
                  <td>{s.absences}</td>
                  <td>{s.annulations}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="meta mt-4">La part plateforme inclut la part de l’acompte conservée en cas d’absence ou d’annulation tardive (70 % médecin / 30 % plateforme). Les frais du prestataire de paiement sont pris sur la part plateforme.</p>
    </>
  )
}
