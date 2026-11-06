'use client'
import { useActionState, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { cancelByDoctorAction } from '@/app/medecin/actions'
import type { ActionState } from '@/lib/types'

export function DoctorCancelForm({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState<ActionState, FormData>(cancelByDoctorAction, {})
  if (state.ok) return <FormMessage state={state} />
  if (!open) return <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(true)}><Icon name="x" /> Annuler</button>
  return (
    <form action={action} className="stack cancel-box">
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <p className="notice warning"><Icon name="circle-alert" /> Le patient sera remboursé de tout ce qu’il a payé et l’équipe MONGANGA sera prévenue.</p>
      <div className="field">
        <label htmlFor={`dr-reason-${appointmentId}`}>Motif (transmis au patient)</label>
        <input className="form-input" id={`dr-reason-${appointmentId}`} name="reason" required maxLength={300} placeholder="Ex. urgence à l’hôpital" />
      </div>
      <FormMessage state={state} />
      <div className="actions">
        <SubmitButton className="btn btn-danger btn-sm" icon="x">Confirmer l’annulation</SubmitButton>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>Retour</button>
      </div>
    </form>
  )
}
