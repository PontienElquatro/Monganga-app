import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { DoctorBadge } from '@/components/ui/status'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { createClient } from '@/lib/supabase/server'
import { dateShort, fullName } from '@/lib/format'
import type { DoctorStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Validations' }

interface Row { id: string; specialty: string; status: DoctorStatus; submitted_at: string; decided_at: string | null; profiles: { first_name: string; last_name: string; email: string } }

const TABS: { key: string; label: string; statuses: DoctorStatus[] }[] = [
  { key: 'a-traiter', label: 'À examiner', statuses: ['en_attente'] },
  { key: 'complement', label: 'Complément demandé', statuses: ['complement_demande'] },
  { key: 'refuses', label: 'Refusés', statuses: ['refuse'] },
]

export default async function ValidationsPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { vue } = await searchParams
  const tab = TABS.find((t) => t.key === vue) ?? TABS[0]
  const supabase = await createClient()
  const { data } = await supabase.from('doctor_profiles')
    .select('id, specialty, status, submitted_at, decided_at, profiles!inner(first_name, last_name, email)')
    .in('status', tab.statuses).order('submitted_at', { ascending: true }).limit(200)
  const rows = (data ?? []) as unknown as Row[]
  return (
    <>
      <PageHeading space="Administration" title="Validation des médecins" description="Vérifiez l’identité, le diplôme et l’inscription à l’Ordre avant d’ouvrir le compte." />
      <nav className="v3-tabs" aria-label="Filtrer les dossiers">
        {TABS.map((t) => <Link key={t.key} className={t.key === tab.key ? 'active' : ''} href={`/admin/validations?vue=${t.key}`}>{t.label}</Link>)}
      </nav>
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Médecin</th><th>Spécialité</th><th>Déposé le</th><th>État</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><span className="table-name">{fullName(r.profiles)}</span><span className="table-sub">{r.profiles.email}</span></td>
                  <td>{r.specialty}</td>
                  <td>{dateShort(r.submitted_at)}</td>
                  <td><DoctorBadge status={r.status} /></td>
                  <td><Link className="btn btn-primary btn-sm" href={`/admin/validations/${r.id}`}>Examiner <Icon name="chevron-right" /></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon="badge-check" title="Aucun dossier ici" text="Les nouvelles candidatures apparaissent dans « À examiner »." />}
    </>
  )
}
