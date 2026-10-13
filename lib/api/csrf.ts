// Protection CSRF « double soumission » + contrôle d'origine (contrat : docs/frontend/BACKEND_INTEGRATION.md).
// Fonctions pures, sans dépendance à Next, pour rester testables.
import { randomBytes, timingSafeEqual } from 'node:crypto'

export const CSRF_COOKIE = 'monganga_csrf'
export const CSRF_HEADER = 'x-csrf-token'

export function newCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/** L'en-tête Origin doit correspondre à l'hôte réellement servi (ou à une origine autorisée). */
export function isSameOrigin(origin: string | null, host: string | null, allowed: string[] = []): boolean {
  if (!origin || !host) return false
  try {
    const url = new URL(origin)
    return url.host === host || allowed.includes(url.origin)
  } catch {
    return false
  }
}

export type CsrfCheck = { ok: true } | { ok: false; reason: 'origin' | 'token' }

export function checkCsrf(input: {
  method: string
  origin: string | null
  host: string | null
  headerToken: string | null
  cookieToken: string | null
  allowedOrigins?: string[]
}): CsrfCheck {
  if (['GET', 'HEAD', 'OPTIONS'].includes(input.method.toUpperCase())) return { ok: true }
  if (!isSameOrigin(input.origin, input.host, input.allowedOrigins)) return { ok: false, reason: 'origin' }
  const { headerToken, cookieToken } = input
  if (!headerToken || !cookieToken || !safeEqual(headerToken, cookieToken)) return { ok: false, reason: 'token' }
  return { ok: true }
}
