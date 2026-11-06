import type { Metadata } from 'next'
import { Avatar } from '@/components/ui/avatar'
import { DoctorBadge } from '@/components/ui/status'
import { ActionForm } from '@/components/ui/action-form'
import { SubmitButton } from '@/components/ui/form'
import { ConfirmSubmit } from '@/components/ui/confirm-submit'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { adminReader } from '@/lib/admin'
import { setCommissionAction, setSuspendedAction } from '@/app/admin/actions'
import { doctorName, usd } from '@/lib/format'
import type { DoctorStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Médecins' }

interface Row {
  id: string; title: string; specialty: string; fee_cents: number; commission_rate: number; status: DoctorStatus
  profiles: { first_name: string; last_name: string; email: string; avatar_url: string | null; suspended_at: string | null }
}

export default async function AdminMedecinsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  // La commission n'est lisible qu'avec le client service (jamais exposée au médecin).
  const admin = await adminReader()
  const [{ data }, { data: ratings }, { data: done }] = await Promise.all([
    admin.from('doctor_profiles')
      .select('id, title, specialty, fee_cents, commission_rate, status, profiles!inner(first_name, last_name, email, avatar_url, suspended_at)')
      .in('status', ['valide', 'suspendu']).order('submitted_at', { ascending: false }).limit(500),
    admin.from('ratings').select('doctor_id, stars'),
    admin.from('appointments').select('doctor_id').eq('status', 'terminee'),
  ])
  const term = (q ?? '').trim().toLowerCase()
  const rows = ((data ?? []) as unknown as Row[]).filter((r) =>
    !term || `${r.profiles.first_name} ${r.profiles.last_name} ${r.specialty} ${r.profiles.email}`.toLowerCase().includes(term))
  const stats = new Map<string, { sum: number; n: number }>()
  for (const r of (ratings ?? []) as { doctor_id: string; stars: number }[]) {
    const s = stats.get(r.doctor_id) ?? { sum: 0, n: 0 }
    stats.set(r.doctor_id, { sum: s.sum + r.stars, n: s.n + 1 })
  }
  const consults = new Map<string, number>()
  for (const r of (done ?? []) as { doctor_id: string }[]) consults.set(r.doctor_id, (consults.get(r.doctor_id) ?? 0) + 1)

  return (
    <>
      <PageHeading space="Administration" title="Médecins" description="Commission par médecin, notes des patients (visibles par l’administration seulement) et suspension." />
      <form className="inline-form mb-4" method="get"><input className="form-input" name="q" defaultValue={q ?? ''} placeholder="Nom, spécialité, e-mail" aria-label="Rechercher un médecin" /><button className="btn btn-secondary" type="submit">Rechercher</button></form>
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Médecin</th><th>Tarif</th><th>Consultations</th><th>Note moyenne</th><th>Commission</th><th>Compte</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const s = stats.get(r.id)
                const suspended = Boolean(r.profiles.suspended_at)
                return (
                  <tr key={r.id}>
                    <td><div className="table-user"><Avatar name={doctorName({ title: r.title, ...r.profiles })} url={r.profiles.avatar_url} size="sm" />
                      <div><span className="table-name">{doctorName({ title: r.title, ...r.profiles })}</span><span className="table-sub">{r.specialty}</span></div></div></td>
                    <td>{usd(r.fee_cents)}</td>
                    <td>{consults.get(r.id) ?? 0}</td>
                    <td>{s ? <span title={`${s.n} avis`}>★ {(s.sum / s.n).toFixed(1).replace('.', ',')} <small className="meta">({s.n})</small></span> : <span className="meta">—</span>}</td>
                    <td>
                      <ActionForm action={setCommissionAction} className="inline-form">
                        <input type="hidden" name="doctor_id" value={r.id} />
                        <input className="form-input" name="rate" defaultValue={String(r.commission_rate).replace('.', ',')} inputMode="decimal" aria-label="Commission en %" style={{ width: 70 }} /> %
                        <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="…">OK</SubmitButton>
                      </ActionForm>
                    </td>
                    <td>
                      <DoctorBadge status={suspended ? 'suspendu' : r.status} />
                      <ActionForm action={setSuspendedAction} className="inline-form">
                        <input type="hidden" name="user_id" value={r.id} />
                        <input type="hidden" name="suspend" value={suspended ? 'false' : 'true'} />
                        {suspended
                          ? <SubmitButton className="btn btn-secondary btn-sm" icon="refresh-cw">Réactiver</SubmitButton>
                          : <ConfirmSubmit label="Suspendre" confirmLabel="Confirmer : annuler ses RDV à venir et suspendre" icon="ban" />}
                      </ActionForm>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon="stethoscope" title="Aucun médecin" text="Les médecins validés apparaissent ici." />}
      <p className="meta mt-4">Un changement de commission s’applique aux prochaines réservations ; les rendez-vous déjà réservés gardent le taux du jour de la réservation. Suspendre annule et rembourse les rendez-vous à venir.</p>
    </>
  )
}
