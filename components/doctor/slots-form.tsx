'use client'
import { useActionState } from 'react'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { createSlotsAction } from '@/app/medecin/actions'
import type { ActionState } from '@/lib/types'

export function SlotsForm({ minDate, maxDate }: { minDate: string; maxDate: string }) {
  const [state, action] = useActionState<ActionState, FormData>(createSlotsAction, {})
  return (
    <form action={action} className="stack">
      <div className="field"><label htmlFor="date">Jour</label><input className="form-input" id="date" name="date" type="date" min={minDate} max={maxDate} defaultValue={minDate} required /></div>
      <div className="grid-2">
        <div className="field"><label htmlFor="from">De</label><input className="form-input" id="from" name="from" type="time" step={1800} defaultValue="09:00" required /></div>
        <div className="field"><label htmlFor="to">À</label><input className="form-input" id="to" name="to" type="time" step={1800} defaultValue="12:00" required /></div>
      </div>
      <div className="field">
        <label htmlFor="weeks">Répéter</label>
        <select className="form-input" id="weeks" name="weeks" defaultValue="1">
          <option value="1">Ce jour uniquement</option>
          <option value="2">Même jour, 2 semaines</option>
          <option value="4">Même jour, 4 semaines</option>
          <option value="8">Même jour, 8 semaines</option>
        </select>
      </div>
      <FormMessage state={state} />
      <SubmitButton icon="plus">Ouvrir les créneaux</SubmitButton>
      <p className="meta">La plage est découpée en créneaux de 30 minutes. Les créneaux qui chevauchent un créneau existant sont ignorés.</p>
    </form>
  )
}
