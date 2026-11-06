'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { forgotPasswordAction } from '../actions'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'

export default function MotDePasseOubliePage() {
  const [state, action] = useActionState(forgotPasswordAction, {})
  return (
    <>
      <h1 className="auth-title">Mot de passe oublié</h1>
      <p className="auth-subtitle">Indiquez votre adresse e-mail : nous vous envoyons un lien pour en choisir un nouveau.</p>
      <form action={action}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Adresse e-mail</label>
          <div className="input-wrap"><Icon name="mail" className="icon-left" /><input type="email" id="email" name="email" className="form-input" required autoComplete="email" /></div>
        </div>
        <FormMessage state={state} />
        <SubmitButton className="btn btn-primary btn-lg btn-block" icon="send" pendingLabel="Envoi…">Envoyer le lien</SubmitButton>
      </form>
      <p className="auth-footer"><Link className="auth-link" href="/connexion">Retour à la connexion</Link></p>
    </>
  )
}
