import { apiError } from './http'
import { getApiSession } from './current-session'

/** Session obligatoire : renvoie { session } ou { denied } (réponse 401 prête à retourner). */
export async function requireApiSession() {
  const session = await getApiSession()
  if (!session) return { denied: apiError(401, 'UNAUTHENTICATED', 'Session expirée. Reconnectez-vous.') } as const
  return { session } as const
}

export const unavailable = () => apiError(503, 'UNAVAILABLE', 'Service indisponible. Réessayez dans quelques instants.')
