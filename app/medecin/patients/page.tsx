import type { Metadata } from 'next'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { createClient } from '@/lib/supabase/server'
import { dateShort } from '@/lib/format'

export const metadata: Metadata = { title: 'Patients' }

interface Row { patient_id: string; patient_name: string; patient_age: number | null; patient_sex: string | null; patient_commune: string | null; patient_avatar: string | null; consultations: number; last_at: string }

export default async function PatientsPage() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('doctor_patients')
  const rows = (data ?? []) as Row[]
  return (
    <>
      <PageHeading space="Espace médecin" title="Patients" description="Les patients que vous avez reçus ou qui ont réservé avec vous. Leurs coordonnées restent privées." />
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Patient</th><th>Âge</th><th>Sexe</th><th>Commune</th><th>Consultations</th><th>Dernier RDV</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.patient_id}>
                  <td><div className="table-user"><Avatar name={r.patient_name} url={r.patient_avatar} size="sm" /><span className="table-name">{r.patient_name}</span></div></td>
                  <td>{r.patient_age ?? '—'}</td>
                  <td>{r.patient_sex === 'F' ? 'F' : r.patient_sex === 'M' ? 'M' : '—'}</td>
                  <td>{r.patient_commune ?? '—'}</td>
                  <td>{r.consultations}</td>
                  <td>{dateShort(r.last_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon="users" title="Aucun patient pour l’instant" text="Vos patients apparaîtront ici après leur première réservation confirmée." />}
    </>
  )
}
