import { type NextRequest } from 'next/server'
import { apiJson, guardMutation } from '@/lib/api/http'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// POST /auth/logout : toujours 200, même sans session active.
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request)
  if (blocked) return blocked
  const supabase = await createClient()
  await supabase.auth.signOut()
  return apiJson({ ok: true })
}
