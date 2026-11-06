'use client'
import { useActionState, useState } from 'react'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { updateDoctorProfileAction } from '@/app/medecin/actions'
import { COMMUNES, PAYOUT_METHODS } from '@/lib/format'
import type { ActionState, DoctorProfile, PayoutMethod } from '@/lib/types'

const LANGS = ['Français', 'Lingala', 'Swahili', 'Kikongo', 'Tshiluba', 'Anglais']

export function DoctorProForm({ doctor, feeMin, feeMax }: { doctor: DoctorProfile; feeMin: number; feeMax: number }) {
  const [state, action] = useActionState<ActionState, FormData>(updateDoctorProfileAction, {})
  const [method, setMethod] = useState<PayoutMethod>(doctor.payout_method)
  return (
    <form action={action} className="stack">
      <h2>Présentation</h2>
      <div className="field"><label htmlFor="bio">Présentation <small>(visible par les patients)</small></label>
        <textarea className="form-input" id="bio" name="bio" rows={5} maxLength={1200} defaultValue={doctor.bio} placeholder="Votre parcours, vos domaines de prise en charge…" /></div>
      <div className="grid-2">
        <div className="field"><label htmlFor="years">Années d’expérience</label><input className="form-input" id="years" name="years" type="number" min={0} max={70} defaultValue={doctor.years_experience ?? ''} /></div>
        <div className="field"><label htmlFor="commune">Commune</label>
          <select className="form-input" id="commune" name="commune" defaultValue={doctor.commune ?? ''}><option value="">—</option>{COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <fieldset className="field">
        <legend>Langues de consultation</legend>
        <div className="check-grid">
          {LANGS.map((l) => (
            <label key={l} className="check"><input type="checkbox" name="languages" value={l} defaultChecked={doctor.languages.includes(l)} /> {l}</label>
          ))}
        </div>
      </fieldset>
      <h2 className="v3-subtitle">Tarif</h2>
      <div className="field"><label htmlFor="fee">Tarif de la consultation (30 min), en dollars</label>
        <input className="form-input" id="fee" name="fee" inputMode="decimal" defaultValue={(doctor.fee_cents / 100).toString().replace('.', ',')} required />
        <small className="meta">Entre {feeMin / 100} $ et {feeMax / 100} $. L’acompte de 1 $ est inclus dans ce tarif. Un changement ne touche pas les rendez-vous déjà réservés.</small></div>
      <h2 className="v3-subtitle">Versements du samedi</h2>
      <div className="field"><label htmlFor="payout_method">Recevoir mes versements par</label>
        <select className="form-input" id="payout_method" name="payout_method" value={method} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value as PayoutMethod)}>
          {PAYOUT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select></div>
      <div className="field"><label htmlFor="payout_account">{method === 'banque' ? 'IBAN ou numéro de compte bancaire' : 'Numéro Mobile Money'}</label>
        <input className="form-input" id="payout_account" name="payout_account" defaultValue={doctor.payout_account} required minLength={6} maxLength={60} /></div>
      <div className="field"><label htmlFor="payout_holder">Titulaire du compte <small>(si différent de votre nom)</small></label>
        <input className="form-input" id="payout_holder" name="payout_holder" defaultValue={doctor.payout_holder ?? ''} maxLength={120} /></div>
      <p className="meta">Les frais de transfert du prestataire sont déduits de chaque versement.</p>
      <FormMessage state={state} />
      <SubmitButton icon="check">Enregistrer le profil professionnel</SubmitButton>
    </form>
  )
}
