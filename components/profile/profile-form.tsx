'use client'
import { useActionState } from 'react'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { updateMyProfileAction } from '@/app/actions/profil'
import { COMMUNES } from '@/lib/format'
import type { ActionState, Profile } from '@/lib/types'

/** Informations personnelles (tous rôles). L'e-mail sert d'identifiant et n'est pas modifiable ici. */
export function ProfileForm({ profile, showHealthFields = true }: { profile: Profile; showHealthFields?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(updateMyProfileAction, {})
  return (
    <form action={action} className="stack">
      <div className="grid-2">
        <div className="field"><label htmlFor="first_name">Prénom</label><input className="form-input" id="first_name" name="first_name" defaultValue={profile.first_name} required maxLength={80} autoComplete="given-name" /></div>
        <div className="field"><label htmlFor="last_name">Nom</label><input className="form-input" id="last_name" name="last_name" defaultValue={profile.last_name} required maxLength={80} autoComplete="family-name" /></div>
      </div>
      <div className="field"><label htmlFor="email">E-mail</label><input className="form-input" id="email" value={profile.email} disabled readOnly /><small className="meta">L’e-mail sert à vous connecter et à recevoir vos notifications.</small></div>
      <div className="field"><label htmlFor="phone">Téléphone <small>(facultatif)</small></label><input className="form-input" id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ''} maxLength={20} placeholder="+243 81 234 5678" autoComplete="tel" /></div>
      {showHealthFields ? (
        <div className="grid-3">
          <div className="field"><label htmlFor="birth_date">Date de naissance</label><input className="form-input" id="birth_date" name="birth_date" type="date" defaultValue={profile.birth_date ?? ''} /></div>
          <div className="field"><label htmlFor="sex">Sexe</label>
            <select className="form-input" id="sex" name="sex" defaultValue={profile.sex ?? ''}><option value="">—</option><option value="F">Femme</option><option value="M">Homme</option></select>
          </div>
          <div className="field"><label htmlFor="commune">Commune</label>
            <select className="form-input" id="commune" name="commune" defaultValue={profile.commune ?? ''}><option value="">—</option>{COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name="birth_date" value={profile.birth_date ?? ''} />
          <input type="hidden" name="sex" value={profile.sex ?? ''} />
          <input type="hidden" name="commune" value={profile.commune ?? ''} />
        </>
      )}
      {showHealthFields ? <p className="meta">L’âge, le sexe et la commune aident le médecin pendant la consultation. Il ne voit jamais votre e-mail ni votre téléphone.</p> : null}
      <FormMessage state={state} />
      <SubmitButton icon="check">Enregistrer</SubmitButton>
    </form>
  )
}
