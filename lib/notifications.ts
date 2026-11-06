import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { NotificationRow } from '@/lib/types'

export async function unreadCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null)
  return count ?? 0
}

export async function listNotifications(limit = 50): Promise<NotificationRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as NotificationRow[]
}
