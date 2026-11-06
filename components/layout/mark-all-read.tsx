'use client'
import { useTransition } from 'react'
import { Icon } from '@/components/ui/icon'
import { markNotificationsReadAction } from '@/app/actions/profil'

export function MarkAllRead() {
  const [pending, start] = useTransition()
  return (
    <button className="btn btn-secondary" type="button" disabled={pending} onClick={() => start(() => markNotificationsReadAction(null))}>
      <Icon name={pending ? 'loader' : 'check'} className={pending ? 'spin' : undefined} /> Tout marquer comme lu
    </button>
  )
}
