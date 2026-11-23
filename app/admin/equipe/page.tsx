import type { Metadata } from 'next'
import { Avatar } from '@/components/ui/avatar'
import { ActionForm } from '@/components/ui/action-form'
import { SubmitButton } from '@/components/ui/form'
import { ConfirmSubmit } from '@/components/ui/confirm-submit'
import { PageHeading } from '@/components/ui/page-heading'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { setTeamRolesAction } from '@/app/admin/actions'
import { ADMIN_ROLES, adminRolesLabel } from '@/lib/admin-roles'
import { fullName } from '@/lib/format'
import type { AdminRole, Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Équipe' }

function RoleChecks({ selected }: { selected?: AdminRole[] }) {
  return (
    <div className="stack" style={{ gap: 8 }}>
      {ADMIN_ROLES.map((r) => (
        <label className="check" key={r.value}>
          <input type="checkbox" name="roles" value={r.value} defaultChecked={selected?.includes(r.value)} />
          <span><strong>{r.label}</strong> <small className="meta">— {r.description}</small></span>
        </label>
      ))}
    </div>
  )
}

export default async function EquipePage() {
  const session = await requireAdmin('super')
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('role', 'admin').order('created_at')
  const team = (data ?? []) as Profile[]
  return (
    <>
      <PageHeading space="Administration" title="Équipe" description="Qui administre MONGANGA et avec quels droits. Chacun ne voit que ce dont il a besoin." />

      <section className="panel stack mb-4">
        <h2>Ajouter un membre</h2>
        <p className="meta">La personne crée d’abord un compte sur le site (comme un patient), puis vous lui donnez ses rôles ici avec la même adresse e-mail. Un compte médecin ne peut pas faire partie de l’équipe.</p>
        <ActionForm action={setTeamRolesAction}>
          <div className="field"><label htmlFor="team-email">Adresse e-mail du compte</label>
            <input className="form-input" id="team-email" name="email" type="email" required placeholder="prenom@exemple.com" /></div>
          <fieldset className="field"><legend className="field-label">Rôles</legend><RoleChecks /></fieldset>
          <SubmitButton icon="user-plus">Ajouter à l’équipe</SubmitButton>
        </ActionForm>
      </section>

      <h2 className="mb-4">Membres ({team.length})</h2>
      <div className="stack">
        {team.map((m) => (
          <section className="panel stack" key={m.id}>
            <div className="table-user">
              <Avatar name={fullName(m) || m.email} url={m.avatar_url} size="sm" />
              <div><span className="table-name">{fullName(m) || '—'}{m.id === session.userId ? ' (vous)' : ''}</span>
                <span className="table-sub">{m.email} · {adminRolesLabel(m.admin_roles)}</span></div>
            </div>
            <ActionForm action={setTeamRolesAction}>
              <input type="hidden" name="email" value={m.email} />
              <RoleChecks selected={m.admin_roles} />
              <div className="actions"><SubmitButton className="btn btn-secondary btn-sm" icon="check">Enregistrer ses rôles</SubmitButton></div>
            </ActionForm>
            {m.id !== session.userId ? (
              <ActionForm action={setTeamRolesAction} className="inline-form">
                <input type="hidden" name="email" value={m.email} />
                <ConfirmSubmit label="Retirer de l’équipe" confirmLabel="Confirmer : retirer tous ses droits d’administration" icon="user-x" />
              </ActionForm>
            ) : null}
          </section>
        ))}
      </div>
      <p className="meta mt-4">Il reste toujours au moins un super administrateur. Aucun rôle ne donne accès aux ordonnances, aux notes des médecins ni aux messages de consultation.</p>
    </>
  )
}
