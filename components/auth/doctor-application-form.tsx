'use client'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/icon'
import { PasswordInput } from '@/components/auth/password-input'
import { COMMUNES, PAYOUT_METHODS, SPECIALTIES } from '@/lib/format'
import {
  finishDoctorSignupAction, resubmitApplicationAction, startDoctorSignupAction, type DocMeta,
} from '@/app/(auth)/actions'
import type { DocumentKind, PayoutMethod } from '@/lib/types'

const DOCS: { kind: DocumentKind; label: string; hint: string; required: boolean }[] = [
  { kind: 'photo', label: 'Photo professionnelle', hint: 'Visage bien visible, JPG ou PNG', required: true },
  { kind: 'identite', label: 'Pièce d’identité', hint: 'Carte d’électeur, passeport ou permis', required: true },
  { kind: 'diplome', label: 'Diplôme de médecine', hint: 'PDF ou photo nette', required: true },
  { kind: 'ordre', label: 'Attestation de l’Ordre des médecins', hint: 'En cours de validité', required: true },
  { kind: 'cv', label: 'Curriculum vitæ', hint: 'PDF de préférence', required: true },
  { kind: 'specialisation', label: 'Diplôme de spécialisation', hint: 'Pour les spécialistes', required: false },
]
const LANGUAGES = ['Français', 'Lingala', 'Swahili', 'Kikongo', 'Tshiluba', 'Anglais']
const MAX = 10 * 1024 * 1024
const TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export interface ApplicationDefaults {
  specialty?: string; bio?: string; fee?: string; languages?: string[]; years?: string; commune?: string
  payout_method?: PayoutMethod; payout_account?: string; payout_holder?: string
}

/**
 * Formulaire de candidature médecin.
 * mode « inscription » : crée le compte + dossier + pièces (envoi direct vers le stockage privé).
 * mode « correction » : médecin connecté qui corrige son dossier après un refus ou une demande de complément.
 */
export function DoctorApplicationForm({ mode, userId, defaults, existingKinds = [] }: {
  mode: 'inscription' | 'correction'
  userId?: string
  defaults?: ApplicationDefaults
  existingKinds?: DocumentKind[]
}) {
  const router = useRouter()
  const [files, setFiles] = useState<Partial<Record<DocumentKind, File>>>({})
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<string | null>(null)
  const d = defaults ?? {}

  function pick(kind: DocumentKind, file: File | undefined) {
    setError(null)
    if (!file) { setFiles((f) => { const n = { ...f }; delete n[kind]; return n }); return }
    if (!TYPES.includes(file.type)) { setError(`« ${file.name} » : formats acceptés PDF, JPG, PNG ou WebP.`); return }
    if (file.size > MAX) { setError(`« ${file.name} » dépasse 10 Mo. Photographiez ou compressez le document.`); return }
    setFiles((f) => ({ ...f, [kind]: file }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const fd = new FormData(form)
    DOCS.forEach((doc) => fd.delete(`doc_${doc.kind}`))
    const docs: DocMeta[] = Object.entries(files).map(([kind, file]) => ({ kind: kind as DocumentKind, name: file!.name, size: file!.size, type: file!.type }))
    const supabase = createClient()

    try {
      if (mode === 'inscription') {
        setStep('Création de votre compte…')
        const res = await startDoctorSignupAction(fd, docs)
        if (res.error || !res.uploads || !res.userId || !res.proof) { setError(res.error ?? 'Erreur inattendue.'); setStep(null); return }
        const done = []
        for (const [i, u] of res.uploads.entries()) {
          setStep(`Envoi des pièces (${i + 1}/${res.uploads.length})…`)
          const { error: upErr } = await supabase.storage.from('candidatures').uploadToSignedUrl(u.path, u.token, files[u.kind]!, { contentType: files[u.kind]!.type })
          if (!upErr) done.push(u)
        }
        setStep('Finalisation du dossier…')
        const fin = await finishDoctorSignupAction(res.userId, res.proof, done)
        if (fin.error) { setError(fin.error); setStep(null); return }
        const email = String(fd.get('email') ?? '')
        router.push(`/verification-email?medecin=1&email=${encodeURIComponent(email)}${done.length < res.uploads.length ? '&pieces=incompletes' : ''}`)
      } else {
        const uploaded: { kind: DocumentKind; path: string; name: string; size: number }[] = []
        const entries = Object.entries(files)
        for (const [i, [kind, file]] of entries.entries()) {
          setStep(`Envoi des pièces (${i + 1}/${entries.length})…`)
          const ext = file!.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
          const path = `${userId}/${kind}-${crypto.randomUUID().slice(0, 8)}.${ext}`
          const { error: upErr } = await supabase.storage.from('candidatures').upload(path, file!, { contentType: file!.type })
          if (upErr) { setError(`Envoi impossible pour « ${file!.name} ». Réessayez.`); setStep(null); return }
          uploaded.push({ kind: kind as DocumentKind, path, name: file!.name, size: file!.size })
        }
        setStep('Envoi du dossier…')
        const res = await resubmitApplicationAction(fd, uploaded)
        if (res.error) { setError(res.error); setStep(null); return }
        router.refresh()
        setStep(null)
      }
    } catch {
      setError('La connexion a été interrompue. Vérifiez votre réseau et réessayez.')
      setStep(null)
    }
  }

  const needDoc = (kind: DocumentKind, required: boolean) => mode === 'inscription' ? required : false
  return (
    <form onSubmit={onSubmit} className="form-stack" noValidate={false}>
      {mode === 'inscription' ? (
        <>
          <h2 className="h4">1. Votre compte</h2>
          <div className="form-grid">
            <div className="field"><label htmlFor="first_name">Prénom</label><input className="form-input" id="first_name" name="first_name" required maxLength={80} autoComplete="given-name" /></div>
            <div className="field"><label htmlFor="last_name">Nom</label><input className="form-input" id="last_name" name="last_name" required maxLength={80} autoComplete="family-name" /></div>
            <div className="field"><label htmlFor="email">Adresse e-mail (identifiant)</label><input className="form-input" id="email" name="email" type="email" required autoComplete="email" /></div>
            <div className="field"><label htmlFor="phone">Téléphone <span className="optional-tag">facultatif, pour l’équipe</span></label><input className="form-input" id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+243 8XX XXX XXX" /></div>
          </div>
          <div className="field"><label htmlFor="password">Mot de passe</label><PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} /><small>Au moins 8 caractères, avec une majuscule et un chiffre.</small></div>
        </>
      ) : null}

      <h2 className="h4">{mode === 'inscription' ? '2.' : '1.'} Votre pratique</h2>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="specialty">Spécialité</label>
          <select className="form-input" id="specialty" name="specialty" required defaultValue={d.specialty ?? ''}>
            <option value="" disabled>Choisir…</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="fee">Votre tarif par consultation de 30 min (USD)</label>
          <input className="form-input" id="fee" name="fee" inputMode="decimal" required placeholder="Ex. 20" defaultValue={d.fee ?? ''} pattern="[0-9]+([.,][0-9]{1,2})?" />
        </div>
        <div className="field">
          <label htmlFor="commune">Commune d’exercice</label>
          <select className="form-input" id="commune" name="commune" defaultValue={d.commune ?? ''}>
            <option value="">Non précisée</option>
            {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="years">Années d’expérience</label>
          <input className="form-input" id="years" name="years" type="number" min={0} max={70} defaultValue={d.years ?? ''} />
        </div>
      </div>
      <fieldset className="field">
        <legend className="field-label">Langues de consultation</legend>
        <div className="actions">
          {LANGUAGES.map((l) => (
            <label className="check" key={l}><input type="checkbox" name="languages" value={l} defaultChecked={(d.languages ?? ['Français', 'Lingala']).includes(l)} /> {l}</label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="bio">Présentation <small>(visible par les patients)</small></label>
        <textarea className="form-input" id="bio" name="bio" maxLength={1200} rows={4} defaultValue={d.bio ?? ''} placeholder="Votre parcours, vos domaines d’expertise…" />
      </div>
      <p className="meta">C’est vous qui fixez votre tarif. Vous recevez votre part chaque samedi soir.</p>

      <h2 className="h4">{mode === 'inscription' ? '3.' : '2.'} Vos versements</h2>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="payout_method">Recevoir mes versements par</label>
          <select className="form-input" id="payout_method" name="payout_method" required defaultValue={d.payout_method ?? 'mpesa'}>
            {PAYOUT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="payout_account">Numéro Mobile Money ou compte bancaire</label>
          <input className="form-input" id="payout_account" name="payout_account" required minLength={6} maxLength={60} defaultValue={d.payout_account ?? ''} />
        </div>
        <div className="field">
          <label htmlFor="payout_holder">Nom du titulaire</label>
          <input className="form-input" id="payout_holder" name="payout_holder" maxLength={120} defaultValue={d.payout_holder ?? ''} />
        </div>
      </div>
      <p className="meta"><Icon name="lock" size={14} /> Ces informations ne sont jamais visibles par les patients.</p>

      <h2 className="h4">{mode === 'inscription' ? '4.' : '3.'} Vos pièces justificatives</h2>
      {mode === 'correction' ? <p className="meta">Ajoutez seulement les pièces à remplacer ou à compléter. Les autres restent dans votre dossier.</p> : null}
      <div className="doc-upload">
        {DOCS.map((doc) => {
          const has = Boolean(files[doc.kind]) || existingKinds.includes(doc.kind)
          return (
            <label className={`doc-row${has ? ' done' : ''}`} key={doc.kind}>
              <Icon name={has ? 'circle-check' : 'file-up'} />
              <span style={{ flex: 1 }}>
                <strong>{doc.label}{needDoc(doc.kind, doc.required) ? ' *' : ''}</strong>
                <small>{files[doc.kind]?.name ?? (existingKinds.includes(doc.kind) ? 'Déjà dans votre dossier' : doc.hint)}</small>
              </span>
              <input type="file" name={`doc_${doc.kind}`} accept="application/pdf,image/jpeg,image/png,image/webp"
                     required={needDoc(doc.kind, doc.required)} onChange={(e: ChangeEvent<HTMLInputElement>) => pick(doc.kind, e.target.files?.[0])} />
            </label>
          )
        })}
      </div>
      <p className="meta"><Icon name="lock" size={14} /> Vos pièces sont stockées en privé ; seule l’équipe de validation peut les ouvrir.</p>

      {mode === 'inscription' ? (
        <label className="check"><input type="checkbox" name="terms" required /> <span>J’accepte les <a className="auth-link" href="/conditions" target="_blank">conditions d’utilisation</a> et la <a className="auth-link" href="/confidentialite" target="_blank">politique de confidentialité</a> de MONGANGA.</span></label>
      ) : null}

      {error ? <p className="notice danger" role="alert">{error}</p> : null}
      {step ? <p className="notice" role="status"><Icon name="loader" className="spin" size={14} /> {step}</p> : null}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={Boolean(step)}>
        <Icon name="send" /> {mode === 'inscription' ? 'Créer mon compte et envoyer mon dossier' : 'Soumettre à nouveau mon dossier'}
      </button>
    </form>
  )
}
