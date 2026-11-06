'use client'
import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction } from '../actions'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { PasswordInput } from '@/components/auth/password-input'

export function LoginForm({ suite }: { suite: string }) {
  const [state, action] = useActionState(loginAction, {})
  return (
    <form action={action}>
      <input type="hidden" name="suite" value={suite} />
      <div className="form-group">
        <label className="form-label" htmlFor="email">Adresse e-mail</label>
        <div className="input-wrap">
          <Icon name="mail" className="icon-left" />
          <input type="email" id="email" name="email" className="form-input" placeholder="vous@exemple.com" required autoComplete="username" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="password">Mot de passe</label>
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <Link className="auth-link" style={{ fontSize: 12 }} href="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary btn-lg btn-block" pendingLabel="Connexion…">Se connecter <Icon name="arrow-right" /></SubmitButton>
    </form>
  )
}
