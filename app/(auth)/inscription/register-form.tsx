'use client'
import { useActionState } from 'react'
import { registerPatientAction } from '../actions'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { PasswordInput } from '@/components/auth/password-input'

export function RegisterPatientForm() {
  const [state, action] = useActionState(registerPatientAction, {})
  return (
    <form action={action}>
      <div className="form-grid" style={{ marginBottom: 16 }}>
        <div className="field"><label htmlFor="first_name">Prénom</label><input className="form-input" id="first_name" name="first_name" required maxLength={80} autoComplete="given-name" placeholder="Aline" /></div>
        <div className="field"><label htmlFor="last_name">Nom</label><input className="form-input" id="last_name" name="last_name" required maxLength={80} autoComplete="family-name" placeholder="Kabila" /></div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="email">Adresse e-mail</label>
        <div className="input-wrap"><Icon name="mail" className="icon-left" /><input type="email" className="form-input" id="email" name="email" required autoComplete="email" placeholder="aline@email.com" /></div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="phone">Téléphone <span className="optional-tag">facultatif</span></label>
        <div className="input-wrap"><Icon name="phone" className="icon-left" /><input type="tel" className="form-input" id="phone" name="phone" autoComplete="tel" placeholder="+243 8XX XXX XXX" /></div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="password">Mot de passe</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} placeholder="Au moins 8 caractères" />
        <p className="meta" style={{ marginTop: 6, fontSize: 12 }}>Au moins 8 caractères, avec une majuscule et un chiffre.</p>
      </div>
      <label className="check" style={{ marginBottom: 16 }}>
        <input type="checkbox" name="terms" required />
        <span>J’accepte les <a className="auth-link" href="/conditions" target="_blank">conditions d’utilisation</a> et la <a className="auth-link" href="/confidentialite" target="_blank">politique de confidentialité</a> de MONGANGA.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary btn-lg btn-block" icon="user-plus" pendingLabel="Création du compte…">Créer mon compte patient</SubmitButton>
      <div className="otp-notice" style={{ marginTop: 20 }}>
        <Icon name="mail-check" />
        <span>Un lien de confirmation sera envoyé à votre adresse e-mail. Vous pourrez ajouter une photo de profil depuis votre espace.</span>
      </div>
    </form>
  )
}
