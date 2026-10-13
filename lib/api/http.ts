import { NextResponse, type NextRequest } from 'next/server'
import { CSRF_COOKIE, CSRF_HEADER, checkCsrf } from './csrf'

/** Format d'erreur du contrat : { code, message, fields? }. */
export function apiError(status: number, code: string, message: string, fields?: Record<string, string>) {
  return NextResponse.json({ code, message, ...(fields ? { fields } : {}) }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

/** Vérifie CSRF + origine pour les mutations. Renvoie une réponse d'erreur, ou null si tout est bon. */
export function guardMutation(request: NextRequest) {
  const allowed = (process.env.APP_ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const result = checkCsrf({
    method: request.method,
    origin: request.headers.get('origin'),
    host: request.headers.get('x-forwarded-host') ?? request.headers.get('host'),
    headerToken: request.headers.get(CSRF_HEADER),
    cookieToken: request.cookies.get(CSRF_COOKIE)?.value ?? null,
    allowedOrigins: allowed,
  })
  if (result.ok) return null
  return apiError(403, 'CSRF_REJECTED', 'Requête refusée. Rechargez la page puis réessayez.')
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json()
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Route du contrat pas encore branchée sur Supabase. */
export function notImplemented() {
  return apiError(501, 'NOT_IMPLEMENTED', 'Cette fonctionnalité n’est pas encore connectée au serveur.')
}
