import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy-session'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Ni les fichiers statiques, ni les webhooks et la tâche planifiée (pas de session utilisateur).
    '/((?!_next/static|_next/image|api/paiements/webhook|api/cron|fonts/|logo/|images/|favicon.ico|icon.png|apple-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)',
  ],
}
