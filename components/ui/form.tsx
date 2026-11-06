'use client'
import { useFormStatus } from 'react-dom'
import { Icon, type IconName } from './icon'
import type { ActionState } from '@/lib/types'

/** Bouton d'envoi qui se désactive pendant l'envoi. */
export function SubmitButton({ children, className = 'btn btn-primary', icon, pendingLabel = 'Un instant…', name, value, disabled }: {
  children: React.ReactNode
  className?: string
  icon?: IconName
  pendingLabel?: string
  name?: string
  value?: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending} name={name} value={value}>
      {pending ? <Icon name="loader" className="spin" /> : icon ? <Icon name={icon} /> : null}
      {pending ? pendingLabel : children}
    </button>
  )
}

/** Message de retour d'une action (erreur ou succès). */
export function FormMessage({ state }: { state: ActionState | undefined | null }) {
  if (!state?.error && !state?.message) return null
  return (
    <p className={`notice ${state.error ? 'danger' : 'success'}`} role={state.error ? 'alert' : 'status'}>
      {state.error ?? state.message}
    </p>
  )
}
