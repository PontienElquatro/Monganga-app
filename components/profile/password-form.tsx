'use client'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Form, FormMessage, SubmitButton } from '@/components/ui/form'
import { PasswordInput } from '@/components/auth/password-input'
import { changePasswordAction } from '@/app/actions/profil'
import type { ActionState } from '@/lib/types'

/** Changement de mot de passe depuis le profil : ancien, nouveau, confirmation. */
export function PasswordForm() {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, {})

  if (state.ok) return <FormMessage state={state} />
  if (!open) {
    return <button className="btn btn-secondary" type="button" onClick={() => setOpen(true)}><Icon name="lock" /> Changer mon mot de passe</button>
  }
  return (
    <Form action={action} className="stack">
      <div className="field"><label htmlFor="current_password">Mot de passe actuel</label>
        <PasswordInput id="current_password" name="current_password" autoComplete="current-password" /></div>
      <div className="field"><label htmlFor="new_password">Nouveau mot de passe</label>
        <PasswordInput id="new_password" name="new_password" autoComplete="new-password" minLength={8} placeholder="Au moins 8 caractères" />
        <small className="meta">Au moins 8 caractères, avec une majuscule et un chiffre.</small></div>
      <div className="field"><label htmlFor="confirm_password">Ressaisissez le nouveau mot de passe</label>
        <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" minLength={8} /></div>
      <FormMessage state={state} />
      <div className="actions">
        <SubmitButton icon="check">Enregistrer</SubmitButton>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>Annuler</button>
      </div>
      <p className="meta">Mot de passe actuel oublié ? <Link className="auth-link" href="/mot-de-passe-oublie">Recevoir un lien par e-mail</Link></p>
    </Form>
  )
}
