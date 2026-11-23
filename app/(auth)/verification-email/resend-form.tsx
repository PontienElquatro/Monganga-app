'use client'
import { useActionState } from 'react'
import { resendConfirmationAction } from '../actions'
import { Form, FormMessage, SubmitButton } from '@/components/ui/form'

export function ResendForm({ email }: { email: string }) {
  const [state, action] = useActionState(resendConfirmationAction, {})
  return (
    <Form action={action} className="form-stack">
      <input type="hidden" name="email" value={email} />
      <FormMessage state={state} />
      <SubmitButton className="btn btn-ghost btn-block" icon="refresh-cw" pendingLabel="Envoi…">Renvoyer le lien</SubmitButton>
    </Form>
  )
}
