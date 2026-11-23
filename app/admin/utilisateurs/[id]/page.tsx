import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { AppointmentBadge, Badge, DoctorBadge } from '@/components/ui/status'
import { ActionForm } from '@/components/ui/action-form'
import { SubmitButton } from '@/components/ui/form'
import { ConfirmSubmit } from '@/components/ui/confirm-submit'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { hasAdminRole, requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { confirmUserEmailAction, deleteUserAction, resendUserConfirmationAction, setSuspendedAction } from '@/app/admin/actions'
import { adminRolesLabel } from '@/lib/admin-roles'
import { DOCUMENT_LABELS, dateLong, dateShort, dateTime, fullName, maskAccount, payoutLabel, usd } from '@/lib/format'
import type { AppointmentStatus, DoctorProfile, DocumentKind, Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Utilisateur' }

const ROLES = { patient: 'Patient', medecin: 'Médecin', admin: 'Administrateur' } as const

interface Row { id: string; reference: string; status: AppointmentStatus; starts_at: string; as_role: 'patient' | 'medecin'; other_name: string; cancel_reason: string | null }

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="muted-row"><span>{label}</span><strong>{children}</strong></div>
}

/** Fiche complète d'un utilisateur pour l'administration : compte, dossier médecin, rendez-vous. Jamais de contenu médical ni de montant. */
export default async function UtilisateurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const session = await requireAdmin('support')
  const isSuper = hasAdminRole(session, 'super')
  const supabase = await createClient()
  const admin = createAdminClient()
  const [{ data: profile }, { data: appts }, { data: auth }, { data: doctor }, { data: docs }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle<Profile & { accepted_terms_at: string | null }>(),
    supabase.rpc('admin_user_appointments', { p_user: id }),
    admin.auth.admin.getUserById(id),
    admin.from('doctor_profiles').select('id, title, specialty, bio, languages, years_experience, commune, fee_cents, status, payout_method, payout_account, payout_holder, admin_message, submitted_at, decided_at').eq('id', id).maybeSingle<DoctorProfile>(),
    admin.from('doctor_documents').select('kind').eq('doctor_id', id),
  ])
  if (!profile) notFound()
  const rows = (appts ?? []) as Row[]
  const confirmedAt = auth?.user?.email_confirmed_at ?? null
  const lastSignIn = auth?.user?.last_sign_in_at ?? null
  const deleted = Boolean(profile.deleted_at)
  const isSelf = profile.id === session.userId
  const canSuspend = !deleted && !isSelf && (profile.role !== 'admin' || isSuper)
  const canDelete = !deleted && !isSelf && isSuper
  const docKinds = new Set(((docs ?? []) as { kind: DocumentKind }[]).map((d) => d.kind))

  return (
    <>
      <PageHeading space="Administration" title={fullName(profile) || profile.email} description="Toutes les informations du compte. Aucun contenu médical ni montant n’apparaît ici."
                   actions={<Link className="btn btn-secondary" href="/admin/utilisateurs"><Icon name="arrow-left" /> Utilisateurs</Link>} />

      <div className="layout-two">
        <section className="panel stack">
          <div className="table-user">
            <Avatar name={fullName(profile) || profile.email} url={profile.avatar_url} />
            <div><span className="table-name">{fullName(profile) || '—'}</span><span className="table-sub">{profile.email}</span></div>
          </div>
          <h2 className="v3-subtitle">Compte</h2>
          <Line label="Rôle">{profile.role === 'admin' ? adminRolesLabel(profile.admin_roles) : ROLES[profile.role]}</Line>
          <Line label="Adresse e-mail"><a className="auth-link" href={`mailto:${profile.email}`}>{profile.email}</a></Line>
          <Line label="E-mail confirmé">{confirmedAt ? `Oui, le ${dateShort(confirmedAt)}` : <Badge tone="pending">Pas encore</Badge>}</Line>
          <Line label="Téléphone">{profile.phone ? <a className="auth-link" href={`tel:${profile.phone.replace(/\s/g, '')}`}>{profile.phone}</a> : '—'}</Line>
          <Line label="Inscrit le">{dateLong(profile.created_at)}</Line>
          <Line label="Conditions acceptées">{profile.accepted_terms_at ? dateShort(profile.accepted_terms_at) : '—'}</Line>
          <Line label="Dernière connexion">{lastSignIn ? dateTime(lastSignIn) : 'Jamais'}</Line>
          <Line label="Accès">{deleted ? <Badge tone="neutral">Supprimé le {dateShort(profile.deleted_at!)}</Badge> : profile.suspended_at ? <Badge tone="suspended">Suspendu depuis le {dateShort(profile.suspended_at)}</Badge> : <Badge tone="active">Actif</Badge>}</Line>
          {!confirmedAt && !deleted ? (
            <div className="stack">
              <p className="meta">Cette personne n’a pas encore cliqué sur le lien de confirmation : elle ne peut pas se connecter.</p>
              <ActionForm action={resendUserConfirmationAction}>
                <input type="hidden" name="user_id" value={profile.id} />
                <SubmitButton className="btn btn-secondary btn-sm" icon="mail">Renvoyer le lien de confirmation</SubmitButton>
              </ActionForm>
              {isSuper ? (
                <ActionForm action={confirmUserEmailAction}>
                  <input type="hidden" name="user_id" value={profile.id} />
                  <SubmitButton className="btn btn-ghost btn-sm" icon="check">Confirmer l’adresse manuellement</SubmitButton>
                </ActionForm>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="panel stack">
          <h2 className="v3-subtitle">Informations personnelles</h2>
          <Line label="Prénom">{profile.first_name || '—'}</Line>
          <Line label="Nom">{profile.last_name || '—'}</Line>
          <Line label="Date de naissance">{profile.birth_date ? dateLong(profile.birth_date) : '—'}</Line>
          <Line label="Sexe">{profile.sex === 'F' ? 'Femme' : profile.sex === 'M' ? 'Homme' : '—'}</Line>
          <Line label="Commune">{profile.commune ?? '—'}</Line>

          {profile.role === 'medecin' ? (
            <>
              <h2 className="v3-subtitle">Dossier médecin</h2>
              {doctor ? (
                <>
                  <Line label="État"><DoctorBadge status={doctor.status} /></Line>
                  <Line label="Spécialité">{doctor.specialty}</Line>
                  <Line label="Tarif">{usd(doctor.fee_cents)}</Line>
                  <Line label="Expérience">{doctor.years_experience != null ? `${doctor.years_experience} an(s)` : '—'}</Line>
                  <Line label="Commune d’exercice">{doctor.commune ?? '—'}</Line>
                  <Line label="Langues">{doctor.languages.join(', ')}</Line>
                  <Line label="Versements">{payoutLabel(doctor.payout_method)} · {maskAccount(doctor.payout_account)}</Line>
                  <Line label="Pièces reçues">{docKinds.size ? [...docKinds].map((k) => DOCUMENT_LABELS[k]).join(', ') : 'Aucune'}</Line>
                  <Line label="Déposé le">{doctor.submitted_at ? dateShort(doctor.submitted_at) : '—'}</Line>
                  {doctor.admin_message ? <p className="meta">Dernier message de l’équipe : {doctor.admin_message}</p> : null}
                  {hasAdminRole(session, 'validation') ? <Link className="btn btn-secondary btn-sm" href={`/admin/validations/${doctor.id}`}><Icon name="badge-check" /> Ouvrir le dossier</Link> : null}
                </>
              ) : <p className="meta">Compte créé, mais aucun dossier déposé pour l’instant. Le médecin peut le compléter depuis « Mon dossier » après connexion.</p>}
            </>
          ) : null}
        </section>
      </div>

      {deleted ? (
        <p className="notice mt-4">Ce compte a été supprimé : la connexion est bloquée et les données personnelles sont effacées. Son historique reste visible ci-dessous, sans nom.</p>
      ) : canSuspend || canDelete ? (
        <section className="panel stack mt-4">
          <h2 className="v3-subtitle">Gérer le compte</h2>
          {canSuspend ? (
            <div className="stack">
              <p className="meta">{profile.suspended_at
                ? 'Le compte est suspendu : la personne ne peut plus rien faire sur MONGANGA. Vous pouvez lui rendre l’accès.'
                : 'Suspendre bloque l’accès tout de suite, sans rien effacer. Les rendez-vous à venir d’un médecin sont annulés et remboursés. Vous pourrez réactiver le compte.'}</p>
              <ActionForm action={setSuspendedAction}>
                <input type="hidden" name="user_id" value={profile.id} />
                <input type="hidden" name="suspend" value={profile.suspended_at ? 'false' : 'true'} />
                {profile.suspended_at
                  ? <SubmitButton className="btn btn-secondary btn-sm" icon="refresh-cw">Réactiver le compte</SubmitButton>
                  : <ConfirmSubmit label="Suspendre le compte" confirmLabel="Confirmer la suspension" icon="ban" className="btn btn-secondary btn-sm" />}
              </ActionForm>
            </div>
          ) : null}
          {canDelete ? (
            <div className="stack">
              <p className="meta">Supprimer est définitif. Sans aucune activité, le compte est effacé entièrement et l’adresse e-mail redevient libre. S’il a un historique (rendez-vous, paiements, ordonnances), ses données personnelles et les pièces de son dossier sont effacées, la connexion est bloquée pour toujours, et l’historique est gardé sans nom.</p>
              <ActionForm action={deleteUserAction}>
                <input type="hidden" name="user_id" value={profile.id} />
                <ConfirmSubmit label="Supprimer le compte" confirmLabel="Confirmer : supprimer définitivement" icon="trash" className="btn btn-ghost btn-sm" />
              </ActionForm>
            </div>
          ) : null}
        </section>
      ) : null}

      <h2 className="mb-4 mt-4">Rendez-vous ({rows.length})</h2>
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
