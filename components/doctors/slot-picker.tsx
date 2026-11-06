'use client'
import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { dateLong, dayKey, time, usd } from '@/lib/format'
import type { ActionState, Slot } from '@/lib/types'

type BookAction = (state: ActionState, formData: FormData) => Promise<ActionState>

/**
 * Choix d'un créneau. En mode « patient », envoie la réservation (acompte ensuite).
 * En mode « public », invite à se connecter.
 */
export function SlotPicker({ slots, depositCents, loginHref, action }: {
  slots: Slot[]
  depositCents: number
  loginHref?: string
  action?: BookAction
}) {
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      const k = dayKey(s.starts_at)
      map.set(k, [...(map.get(k) ?? []), s])
    }
    return [...map.entries()]
  }, [slots])
  const [selected, setSelected] = useState<string | null>(null)
  const [state, formAction] = useActionState<ActionState, FormData>(action ?? (async () => ({})), {})

  if (!slots.length) {
    return (
      <div className="empty-state">
        <Icon name="calendar" />
        <h2>Aucun créneau disponible</h2>
        <p>Ce médecin n’a pas encore ouvert de créneaux pour les deux prochaines semaines. Revenez bientôt ou choisissez un autre médecin.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="panel stack">
      <div>
        <h2>Choisissez un créneau</h2>
        <p className="meta">Heure de Kinshasa · consultation de 30 minutes</p>
      </div>
      {days.map(([key, list]) => (
        <fieldset className="date-group" key={key}>
          <legend><h3>{dateLong(list[0].starts_at)}</h3></legend>
          <div className="slots">
            {list.map((s) => (
              <label className="slot-choice" key={s.id}>
                <input type="radio" name="slot_id" value={s.id} required checked={selected === s.id} onChange={() => setSelected(s.id)} />
                <span>{time(s.starts_at)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {action ? (
        <>
          <div className="field">
            <label htmlFor="reason">Motif de consultation <small>(facultatif, visible par le médecin)</small></label>
            <textarea className="form-input" id="reason" name="reason" maxLength={500} rows={3} placeholder="Ex. toux depuis 5 jours" />
          </div>
          <FormMessage state={state} />
          <SubmitButton className="btn btn-primary btn-lg btn-block" icon="lock" disabled={!selected}>
            Réserver — payer {usd(depositCents)} d’acompte
          </SubmitButton>
          <p className="meta">Le créneau est retenu 15 minutes, le temps de payer l’acompte.</p>
        </>
      ) : (
        <Link className="btn btn-primary btn-lg btn-block" href={loginHref ?? '/connexion'}><Icon name="log-in" /> Se connecter pour réserver</Link>
      )}
    </form>
  )
}
