import { apiError, apiJson } from '@/lib/api/http'
import { getApiSession } from '@/lib/api/current-session'

export const dynamic = 'force-dynamic'

// GET /auth/me -> Session, ou 401
export async function GET() {
  const session = await getApiSession()
  if (!session) return apiError(401, 'UNAUTHENTICATED', 'Session expirée. Reconnectez-vous.')
  return apiJson(session)
}
