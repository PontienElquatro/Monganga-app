import { apiJson } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { toApiNotification, type NotificationRow } from '@/lib/api/mappers'

export const dynamic = 'force-dynamic'

// GET /notifications -> Notification[] : les 50 dernières du compte (RLS : user_id = auth.uid()).
export async function GET() {
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications').select('id, title, body, is_read, created_at')
    .eq('user_id', auth.session.id).order('created_at', { ascending: false }).limit(50)
  if (error) return unavailable()
  return apiJson(((data ?? []) as NotificationRow[]).map(toApiNotification))
}
