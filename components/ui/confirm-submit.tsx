'use client'
import { useState } from 'react'
import { Icon, type IconName } from './icon'
import { SubmitButton } from './form'

/** Bouton d'envoi en deux temps, pour les actions lourdes (suspension, refus…). */
export function ConfirmSubmit({ label, confirmLabel, icon, className = 'btn btn-ghost btn-sm', confirmClassName = 'btn btn-danger btn-sm' }: {
  label: string
  confirmLabel: string
  icon?: IconName
  className?: string
  confirmClassName?: string
}) {
  const [armed, setArmed] = useState(false)
  if (!armed) {
    return <button type="button" className={className} onClick={() => setArmed(true)}>{icon ? <Icon name={icon} /> : null}{label}</button>
  }
  return (
    <span className="inline-form">
      <SubmitButton className={confirmClassName} icon={icon}>{confirmLabel}</SubmitButton>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArmed(false)}>Annuler</button>
    </span>
  )
}
