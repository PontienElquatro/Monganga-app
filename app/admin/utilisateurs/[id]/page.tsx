import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { AppointmentBadge, Badge } from '@/components/ui/status'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { dateShort, dateTime, fullName } from '@/lib/format'
import type { AppointmentStatus, Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Utilisateur' }

const ROLES = { patient: 'Patient', medecin: 'Médecin', admin: 'Administrateur' } as const

interface Row { id: string; reference: string; status: AppointmentStatus; starts_at: string; as_role: 'patient' | 'medecin'; other_name: string; cancel_reason: string | null }

/** Fiche utilisateur pour le support : compte et rendez-vous, sans aucun montant ni contenu médical. */
export default async function UtilisateurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  await requireAdmin('support')
  const supabase = await createClient()
  const [{ data: profile }, { data: appts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle<Profile>(),
    supabase.rpc('admin_user_appointments', { p_user: id }),
  ])
  if (!profile) notFound()
  const rows = (appts ?? []) as Row[]
  return (
    <>
      <PageHeading space="Administration" title={fullName(profile) || profile.email} description="Compte et rendez-vous de cet utilisateur."
                   actions={<Link className="btn btn-secondary" href="/admin/utilisateurs"><Icon name="arrow-left" /> Utilisateurs</Link>} />
      <section className="panel stack mb-4">
        <div className="table-user">
          <Avatar name={fullName(profile) || profile.email} url={profile.avatar_url} />
          <div><span className="table-name">{fullName(profile) || '—'}</span><span className="table-sub">{profile.email}</span></div>
        </div>
        <div className="muted-row"><span>Rôle</span><strong>{ROLES[profile.role]}</strong></div>
        <div className="muted-row"><span>Téléphone</span><strong>{profile.phone ?? '—'}</strong></div>
        <div className="muted-row"><span>Commune</span><strong>{profile.commune ?? '—'}</strong></div>
        <div className="muted-row"><span>Inscrit le</span><strong>{dateShort(profile.created_at)}</strong></div>
        <div className="muted-row"><span>Accès</span>{profile.suspended_at ? <Badge tone="suspended">Suspendu</Badge> : <Badge tone="active">Actif</Badge>}</div>
      </section>
      <h2 className="mb-4">Rendez-vous ({rows.length})</h2>
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Référence</th><th>Avec</th><th>Statut</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{dateTime(r.starts_at)}</td>
                  <td className="mono">{r.reference}</td>
                  <td>{r.other_name}<span className="table-sub">{r.as_role === 'patient' ? 'Médecin' : 'Patient'}</span></td>
                  <td><AppointmentBadge status={r.status} />{r.cancel_reason ? <span className="table-sub">Motif : {r.cancel_reason}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon="calendar" title="Aucun rendez-vous" />}
      <p className="meta mt-4">Pour une question de paiement ou de remboursement, transmettez la référence à l’équipe Finance.</p>
    </>
  )
}
