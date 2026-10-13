import { NextResponse, type NextRequest } from 'next/server'
import { CSRF_COOKIE, newCsrfToken } from '@/lib/api/csrf'

export const dynamic = 'force-dynamic'

// GET /auth/csrf : renvoie { csrfToken } et pose le cookie lisible monganga_csrf (double soumission).
export async function GET(request: NextRequest) {
  const token = request.cookies.get(CSRF_COOKIE)?.value || newCsrfToken()
  const response = NextResponse.json({ csrfToken: token }, { headers: { 'Cache-Control': 'no-store' } })
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false, // le front doit pouvoir le relire pour l'en-tête X-CSRF-Token
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return response
}
