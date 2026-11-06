'use client'
import { useActionState, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { FormMessage, SubmitButton } from '@/components/ui/form'
import { PAYMENT_METHODS, usd } from '@/lib/format'
import type { ActionState, PaymentKind, PaymentMethod } from '@/lib/types'

type Action = (state: ActionState, fd: FormData) => Promise<ActionState>

/** Choix du moyen de paiement (Mobile Money ou carte) et envoi vers le prestataire. */
export function PayForm({ action, appointmentId, kind, amountCents, defaultPhone, cta }: {
  action: Action
  appointmentId: string
  kind: PaymentKind
  amountCents: number
  defaultPhone: string | null
  cta: string
}) {
  const [method, setMethod] = useState<PaymentMethod>('mpesa')
  const [state, formAction] = useActionState<ActionState, FormData>(action, {})
  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <input type="hidden" name="kind" value={kind} />
      <fieldset className="v3-methods">
        <legend>Moyen de paiement</legend>
        {PAYMENT_METHODS.map((m) => (
          <label key={m.value} className={`v3-method${method === m.value ? ' is-selected' : ''}`}>
            <input type="radio" name="method" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} />
            <span className="v3-method-logo">{m.logo ? <img src={m.logo} alt="" /> : <Icon name="credit-card" />}</span>
            <span>{m.label}{m.hint ? <small>{m.hint}</small> : null}</span>
          </label>
        ))}
      </fieldset>
      {method !== 'carte' ? (
        <div className="field">
          <label htmlFor="pay-phone">Numéro Mobile Money à débiter</label>
          <input className="form-input" id="pay-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
                 defaultValue={defaultPhone ?? ''} placeholder="+243 81 234 5678" required maxLength={20} />
          <small className="meta">Vous recevrez une demande de confirmation sur ce téléphone.</small>
        </div>
      ) : (
        <p className="meta">Vous serez redirigé vers la page sécurisée du partenaire pour saisir votre carte.</p>
      )}
      <FormMessage state={state} />
      <SubmitButton className="btn btn-primary btn-lg btn-block" icon="lock" pendingLabel="Connexion au paiement…">
        {cta} · {usd(amountCents)}
      </SubmitButton>
      <p className="meta v3-secure"><Icon name="shield-check" /> Paiement traité par notre partenaire agréé. MONGANGA ne conserve aucun numéro de carte.</p>
    </form>
  )
}
