import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { MarkAllRead } from '@/components/layout/mark-all-read'
import { listNotifications } from '@/lib/notifications'
import { dateTime } from '@/lib/format'

export const metadata: Metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const list = await listNotifications(80)
  const unread = list.filter((n) => !n.read_at).length
  return (
    <>
      <PageHeading title="Notifications" description="Les mêmes informations vous sont aussi envoyées par e-mail."
                   actions={unread ? <MarkAllRead /> : null} />
      {list.length ? (
        <ul className="notif-list">
          {list.map((n) => (
            <li key={n.id} className={`notif-item${n.read_at ? '' : ' unread'}`}>
              <span className="notif-icon"><Icon name={n.read_at ? 'bell' : 'circle-alert'} /></span>
              <div>
                <strong>{n.title}</strong>
                <p>{n.body}</p>
                <span className="meta">{dateTime(n.created_at)}</span>
              </div>
              {n.link ? <Link className="btn btn-ghost btn-sm" href={n.link}>Ouvrir <Icon name="chevron-right" /></Link> : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="bell" title="Aucune notification" text="Vous serez prévenu ici et par e-mail à chaque étape de vos rendez-vous." />
      )}
    </>
  )
}
