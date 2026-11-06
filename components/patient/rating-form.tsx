'use client'
import { useActionState, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { rateAppointmentAction } from '@/app/patient/actions'
import type { ActionState } from '@/lib/types'

/** Note de 1 à 5 étoiles, transmise uniquement à l'administration. */
export function RatingForm({ appointmentId }: { appointmentId: string }) {
  const [stars, setStars] = useState(0)
  const [state, action] = useActionState<ActionState, FormData>(rateAppointmentAction, {})
  if (state.ok) return <FormMessage state={state} />
  return (
    <form action={action} className="v3-rate">
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <strong>Comment s’est passée votre consultation ?</strong>
      <fieldset className="stars-input">
        <legend className="sr-only">Note sur 5</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= stars ? 'on' : ''}>
            <input type="radio" name="stars" value={n} checked={stars === n} onChange={() => setStars(n)} required />
            <span aria-hidden="true">★</span>
            <span className="sr-only">{n} étoile{n > 1 ? 's' : ''}</span>
          </label>
        ))}
      </fieldset>
      <textarea className="form-input" name="comment" rows={2} maxLength={1000} placeholder="Un commentaire pour l’équipe (facultatif)" />
      <p className="meta"><Icon name="eye-off" /> Votre note est transmise uniquement à l’équipe MONGANGA. Elle n’est pas publiée et le médecin ne la voit pas.</p>
      <FormMessage state={state} />
      <SubmitButton className="btn btn-secondary" disabled={!stars}>Envoyer ma note</SubmitButton>
    </form>
  )
}
