'use client'
import { useActionState } from 'react'
import { FormMessage } from './form'
import type { ActionState } from '@/lib/types'

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>

/** Petit formulaire d'action avec son message de retour (utilisable depuis une page serveur). */
export function ActionForm({ action, children, className = 'stack', hideOnSuccess = false }: {
  action: Action
  children: React.ReactNode
  className?: string
  hideOnSuccess?: boolean
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {})
  if (hideOnSuccess && state.ok) return <FormMessage state={state} />
  return (
    <form action={formAction} className={className}>
      {children}
      <FormMessage state={state} />
    </form>
  )
}
