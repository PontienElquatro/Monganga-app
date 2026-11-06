import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { dateShort } from '@/lib/format'
import type { Prescription } from '@/lib/types'

export const metadata: Metadata = { title: 'Ordonnances émises' }

export default async function MedecinOrdonnancesPage() {
  const session = await requireRole('medecin')
  const supabase = await createClient()
  const [{ data }, { data: patients }] = await Promise.all([
    supabase.from('prescriptions').select('id, code, appointment_id, doctor_id, patient_id, items, instructions, issued_at, expires_at')
      .eq('doctor_id', session.userId).order('issued_at', { ascending: false }).limit(200),
    supabase.rpc('doctor_patients'),
  ])
  const list = (data ?? []) as Prescription[]
  const names = new Map(((patients ?? []) as { patient_id: string; patient_name: string }[]).map((p) => [p.patient_id, p.patient_name]))
  return (
    <>
      <PageHeading space="Espace médecin" title="Ordonnances émises" description="Vos ordonnances des 30 derniers jours. Elles sont supprimées automatiquement ensuite." />
      {list.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>N°</th><th>Patient</th><th>Médicaments</th><th>Émise le</th><th>Expire le</th><th></th></tr></thead>
            <tbody>
              {list.map((rx) => (
                <tr key={rx.id}>
                  <td><strong>{rx.code}</strong></td>
                  <td>{names.get(rx.patient_id) ?? 'Patient'}</td>
                  <td>{rx.items.map((i) => i.name).join(', ')}</td>
                  <td>{dateShort(rx.issued_at)}</td>
                  <td>{dateShort(rx.expires_at)}</td>
                  <td><a className="btn btn-ghost btn-sm" href={`/api/ordonnances/${rx.id}/pdf`}><Icon name="download" /> PDF</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon="file-text" title="Aucune ordonnance récente" text="Les ordonnances s’émettent depuis la salle de consultation." />}
    </>
  )
}
