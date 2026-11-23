'use client'
import { createContext, useContext, useTransition, type FormEvent, type FormHTMLAttributes } from 'react'
import { useFormStatus } from 'react-dom'
import { Icon, type IconName } from './icon'
import type { ActionState } from '@/lib/types'

const FormPending = createContext(false)

/**
 * Formulaire qui garde ce que l'utilisateur a saisi quand l'envoi échoue
 * (un <form action={...}> classique est vidé par React après chaque envoi,
 * y compris les listes déroulantes comme le sexe ou la commune).
 */
export function Form({ action, children, ...rest }: Omit<FormHTMLAttributes<HTMLFormElement>, 'action' | 'onSubmit'> & {
  action: (formData: FormData) => void
}) {
  const [pending, startTransition] = useTransition()
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const form = event.currentTarget
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    let formData: FormData
    try {
      formData = new FormData(form, submitter)
    } catch {
      formData = new FormData(form)
      if (submitter?.name) formData.append(submitter.name, submitter.value)
    }
    startTransition(() => action(formData))
  }
  return (
    <FormPending.Provider value={pending}>
      <form {...rest} onSubmit={onSubmit} aria-busy={pending || undefined}>{children}</form>
    </FormPending.Provider>
  )
}

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
  const status = useFormStatus()
  const formPending = useContext(FormPending)
  const pending = status.pending || formPending
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
