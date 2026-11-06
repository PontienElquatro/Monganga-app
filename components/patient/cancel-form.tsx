'use client'
import { useActionState, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { cancelAppointmentAction } from '@/app/patient/actions'
import type { ActionState } from '@/lib/types'

/** Annulation en deux temps : la conséquence (remboursement ou non) est annoncée avant de confirmer. */
export function CancelForm({ appointmentId, consequence }: { appointmentId: string; consequence: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState<ActionState, FormData>(cancelAppointmentAction, {})
  if (state.ok) return <FormMessage state={state} />
  if (!open) {
    return <button className="btn btn-secondary" type="button" onClick={() => setOpen(true)}><Icon name="x" /> Annuler</button>
  }
  return (
    <form action={action} className="stack cancel-box">
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <p className="notice warning"><Icon name="circle-alert" /> {consequence}</p>
      <div className="field">
        <label htmlFor={`reason-${appointmentId}`}>Motif <small>(facultatif)</small></label>
        <input className="form-input" id={`reason-${appointmentId}`} name="reason" maxLength={300} />
      </div>
      <FormMessage state={state} />
      <div className="actions">
        <SubmitButton className="btn btn-danger" icon="x">Confirmer l’annulation</SubmitButton>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>Garder le rendez-vous</button>
      </div>
    </form>
  )
}
