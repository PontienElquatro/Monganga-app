import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Les fichiers statiques du front (/assets : js, css, polices, images) ne passent pas
  // par Supabase : inutile et coûteux de rafraîchir la session pour chacun d'eux.
  matcher: [
    '/((?!_next/static|_next/image|assets/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|jfif|gif|webp|css|js|woff2)$).*)',
  ],
}
