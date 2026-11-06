'use client'
import { useActionState } from 'react'
import { resetPasswordAction } from '../actions'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { PasswordInput } from '@/components/auth/password-input'

export default function ReinitialiserPage() {
  const [state, action] = useActionState(resetPasswordAction, {})
  return (
    <>
      <h1 className="auth-title">Nouveau mot de passe</h1>
      <p className="auth-subtitle">Choisissez un mot de passe d’au moins 8 caractères, avec une majuscule et un chiffre.</p>
      <form action={action}>
        <div className="form-group"><label className="form-label" htmlFor="password">Nouveau mot de passe</label><PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} /></div>
        <div className="form-group"><label className="form-label" htmlFor="confirm">Confirmez le mot de passe</label><PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} /></div>
        <FormMessage state={state} />
        <SubmitButton className="btn btn-primary btn-lg btn-block" icon="check" pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
      </form>
    </>
  )
}
