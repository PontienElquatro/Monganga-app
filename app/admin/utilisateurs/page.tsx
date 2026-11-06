import Link from 'next/link'
import type { Metadata } from 'next'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/status'
import { ActionForm } from '@/components/ui/action-form'
import { SubmitButton } from '@/components/ui/form'
import { ConfirmSubmit } from '@/components/ui/confirm-submit'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { setSuspendedAction } from '@/app/admin/actions'
import { dateShort, fullName } from '@/lib/format'
import type { Profile, UserRole } from '@/lib/types'

export const metadata: Metadata = { title: 'Utilisateurs' }

const ROLES: Record<UserRole, string> = { patient: 'Patient', medecin: 'Médecin', admin: 'Administrateur' }

export default async function UtilisateursPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const { q, role } = await searchParams
  const session = await requireRole('admin')
  const supabase = await createClient()
  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(300)
  if (role && role in ROLES) query = query.eq('role', role)
  const term = (q ?? '').trim().replace(/[%,()]/g, ' ').slice(0, 60)
  if (term) query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
  const { data } = await query
  const rows = (data ?? []) as Profile[]
  return (
    <>
      <PageHeading space="Administration" title="Utilisateurs" description="Patients, médecins et administrateurs. Suspendre bloque l’accès et annule (avec remboursement) les rendez-vous à venir." />
      <form className="inline-form mb-4" method="get">
        <input className="form-input" name="q" defaultValue={q ?? ''} placeholder="Nom ou e-mail" aria-label="Rechercher" />
        <select className="form-input" name="role" defaultValue={role ?? ''} aria-label="Rôle">
          <option value="">Tous les rôles</option>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn btn-secondary" type="submit">Filtrer</button>
        {q || role ? <Link className="btn btn-ghost" href="/admin/utilisateurs">Réinitialiser</Link> : null}
      </form>
      {rows.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Utilisateur</th><th>Rôle</th><th>Téléphone</th><th>Inscrit le</th><th>Accès</th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td><div className="table-user"><Avatar name={fullName(p) || p.email} url={p.avatar_url} size="sm" /><div><span className="table-name">{fullName(p) || '—'}</span><span className="table-sub">{p.email}</span></div></div></td>
                  <td>{ROLES[p.role]}</td>
                  <td>{p.phone ?? '—'}</td>
                  <td>{dateShort(p.created_at)}</td>
                  <td>
                    {p.suspended_at ? <Badge tone="suspended">Suspendu</Badge> : <Badge tone="active">Actif</Badge>}
                    {p.id !== session.userId && p.role !== 'admin' ? (
                      <ActionForm action={setSuspendedAction} className="inline-form">
                        <input type="hidden" name="user_id" value={p.id} />
                        <input type="hidden" name="suspend" value={p.suspended_at ? 'false' : 'true'} />
                        {p.suspended_at
                          ? <SubmitButton className="btn btn-secondary btn-sm" icon="refresh-cw">Réactiver</SubmitButton>
                          : <ConfirmSubmit label="Suspendre" confirmLabel="Confirmer la suspension" icon="ban" />}
                      </ActionForm>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState icon="users" title="Aucun utilisateur trouvé" />}
    </>
  )
}
