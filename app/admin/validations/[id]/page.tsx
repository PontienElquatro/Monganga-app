import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { DoctorBadge } from '@/components/ui/status'
import { ActionForm } from '@/components/ui/action-form'
import { SubmitButton } from '@/components/ui/form'
import { PageHeading } from '@/components/ui/page-heading'
import { createClient } from '@/lib/supabase/server'
import { decideApplicationAction } from '@/app/admin/actions'
import { DOCUMENT_LABELS, dateLong, fullName, maskAccount, payoutLabel, usd } from '@/lib/format'
import type { DocumentKind, DoctorProfile, Profile } from '@/lib/types'

export const metadata: Metadata = { title: 'Examen du dossier' }

const REQUIRED: DocumentKind[] = ['photo', 'identite', 'diplome', 'ordre', 'cv']

export default async function ValidationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = await createClient()
  const [{ data: doctor }, { data: profile }, { data: docs }] = await Promise.all([
    supabase.from('doctor_profiles').select('id, title, specialty, bio, languages, years_experience, commune, fee_cents, status, payout_method, payout_account, payout_holder, admin_message, submitted_at, decided_at').eq('id', id).maybeSingle<DoctorProfile>(),
    supabase.from('profiles').select('*').eq('id', id).maybeSingle<Profile>(),
    supabase.from('doctor_documents').select('id, kind, storage_path, file_name, size_bytes, uploaded_at').eq('doctor_id', id).order('uploaded_at'),
  ])
  if (!doctor || !profile) notFound()
  const documents = (docs ?? []) as { id: string; kind: DocumentKind; storage_path: string; file_name: string; size_bytes: number; uploaded_at: string }[]
  // Liens temporaires (10 min) vers l'espace privé des candidatures.
  const signed = documents.length
    ? (await supabase.storage.from('candidatures').createSignedUrls(documents.map((d) => d.storage_path), 600)).data ?? []
    : []
  const urlFor = (path: string) => signed.find((s) => s.path === path)?.signedUrl ?? null
  const missing = REQUIRED.filter((k) => !documents.some((d) => d.kind === k))
  const name = `${doctor.title} ${fullName(profile)}`
  const decidable = doctor.status === 'en_attente' || doctor.status === 'complement_demande'

  return (
    <>
      <div className="breadcrumb mb-4"><Link href="/admin/validations">Validations</Link><Icon name="chevron-right" /><span>{name}</span></div>
      <PageHeading space="Administration" title={name} description={`${doctor.specialty} · dossier déposé le ${dateLong(doctor.submitted_at)}`}
                   actions={<DoctorBadge status={doctor.status} />} />
      <div className="layout-two">
        <section className="stack">
          <div className="panel stack">
            <div className="person"><Avatar name={name} url={profile.avatar_url} size="xl" /><div><strong>{name}</strong><p className="meta">{profile.email}{profile.phone ? ` · ${profile.phone}` : ''}</p></div></div>
            <dl className="kv">
              <dt>Spécialité</dt><dd>{doctor.specialty}</dd>
              <dt>Expérience</dt><dd>{doctor.years_experience != null ? `${doctor.years_experience} ans` : '—'}</dd>
              <dt>Commune</dt><dd>{doctor.commune ?? '—'}</dd>
              <dt>Langues</dt><dd>{doctor.languages.join(', ')}</dd>
              <dt>Tarif demandé</dt><dd>{usd(doctor.fee_cents)}</dd>
              <dt>Versements</dt><dd>{payoutLabel(doctor.payout_method)} · {maskAccount(doctor.payout_account)}{doctor.payout_holder ? ` (${doctor.payout_holder})` : ''}</dd>
            </dl>
            {doctor.bio ? <><h3>Présentation</h3><p className="pre-line">{doctor.bio}</p></> : null}
            {doctor.admin_message ? <p className="notice warning"><Icon name="info" /> Dernier message envoyé : {doctor.admin_message}</p> : null}
          </div>
          <div className="panel stack">
            <h2>Pièces du dossier</h2>
            {missing.length ? <p className="notice danger"><Icon name="circle-alert" /> Pièces obligatoires manquantes : {missing.map((k) => DOCUMENT_LABELS[k]).join(', ')}.</p> : null}
            {documents.length ? (
              <ul className="v3-docs">
                {documents.map((d) => {
                  const url = urlFor(d.storage_path)
                  return (
                    <li key={d.id}>
                      <Icon name="file-text" />
                      <span><strong>{DOCUMENT_LABELS[d.kind]}</strong><small>{d.file_name} · {Math.max(1, Math.round(d.size_bytes / 1024))} Ko</small></span>
                      {url ? <a className="btn btn-secondary btn-sm" href={url} target="_blank" rel="noopener noreferrer"><Icon name="eye" /> Ouvrir</a> : <span className="meta">indisponible</span>}
                    </li>
                  )
                })}
              </ul>
            ) : <p className="meta">Aucune pièce déposée.</p>}
            <p className="meta"><Icon name="lock" /> Liens privés valables 10 minutes. Vérifiez le numéro d’inscription auprès de l’Ordre des médecins en cas de doute.</p>
          </div>
        </section>
        <aside className="panel stack">
          <h2>Décision</h2>
          {decidable ? (
            <>
              <ActionForm action={decideApplicationAction} hideOnSuccess>
                <input type="hidden" name="doctor_id" value={doctor.id} />
                <input type="hidden" name="decision" value="valider" />
                <SubmitButton className="btn btn-primary btn-block" icon="badge-check" disabled={missing.length > 0}>Valider le dossier</SubmitButton>
                <p className="meta">Le médecin est prévenu et peut aussitôt ouvrir ses créneaux. Commission par défaut appliquée (modifiable dans « Médecins »).</p>
              </ActionForm>
              <hr />
              <ActionForm action={decideApplicationAction} hideOnSuccess>
                <input type="hidden" name="doctor_id" value={doctor.id} />
                <div className="field"><label htmlFor="message">Message au médecin</label>
                  <textarea className="form-input" id="message" name="message" rows={4} maxLength={1000} placeholder="Ex. L’attestation de l’Ordre est illisible, merci d’en envoyer une copie nette." /></div>
                <div className="actions">
                  <SubmitButton className="btn btn-secondary" icon="mail" name="decision" value="completer">Demander un complément</SubmitButton>
                  <SubmitButton className="btn btn-danger" icon="circle-x" name="decision" value="refuser">Refuser</SubmitButton>
                </div>
                <p className="meta">Le médecin voit ce message dans son espace et reçoit un e-mail. Il peut corriger et soumettre à nouveau.</p>
              </ActionForm>
            </>
          ) : (
            <p className="meta">Ce dossier est « {doctor.status === 'refuse' ? 'refusé' : doctor.status} ». Il reviendra dans « À examiner » si le médecin le soumet à nouveau.</p>
          )}
        </aside>
      </div>
    </>
  )
}
