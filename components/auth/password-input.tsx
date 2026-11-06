'use client'
import { useState } from 'react'
import { Icon } from '@/components/ui/icon'

export function PasswordInput({ id, name, autoComplete, placeholder = '••••••••', minLength }: { id: string; name: string; autoComplete: string; placeholder?: string; minLength?: number }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="input-wrap">
      <Icon name="lock" className="icon-left" />
      <input type={visible ? 'text' : 'password'} id={id} name={name} className="form-input" placeholder={placeholder} required
             autoComplete={autoComplete} minLength={minLength} style={{ paddingRight: 42 }} />
      <button type="button" className="password-toggle" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible}>
        <Icon name={visible ? 'eye-off' : 'eye'} />
      </button>
    </div>
  )
}
