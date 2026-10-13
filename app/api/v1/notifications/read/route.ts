import { type NextRequest } from 'next/server'
import { apiJson, guardMutation } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /notifications/read : marque toutes les notifications du compte comme lues.
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request)
  if (blocked) return blocked
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const supabase = await createClient()
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', auth.session.id).eq('is_read', false)
  if (error) return unavailable()
  return apiJson({ ok: true })
}
