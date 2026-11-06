'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Icon } from '@/components/ui/icon'

/** Cloche avec le nombre de notifications non lues, mis à jour en temps réel. */
export function NotificationsBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => setUnread((n) => n + 1))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])
  return (
    <span className="icon-btn-wrap">
      <Link className="btn btn-ghost btn-icon" href="/notifications" aria-label={unread ? `${unread} notification(s) non lue(s)` : 'Notifications'}>
        <Icon name="bell" />
      </Link>
      {unread > 0 ? <span className="notif-dot" aria-hidden="true">{unread > 9 ? '9+' : unread}</span> : null}
    </span>
  )
}
