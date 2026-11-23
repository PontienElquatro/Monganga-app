import 'server-only'
import { env } from '@/lib/config'

/**
 * Appels au stockage Supabase depuis le serveur (Cloudflare Workers) : le service de stockage
 * identifie le projet grâce à l'en-tête X-Forwarded-Host. Depuis un Worker, cet en-tête peut
 * manquer ou viser monganga.org, d'où l'erreur « Invalid tenant id ». On le fixe explicitement
 * sur l'adresse du projet Supabase, et seulement pour les appels au stockage.
 */
export const storageFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (!url.includes('/storage/v1/')) return fetch(input, init)
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined))
  headers.set('x-forwarded-host', new URL(env.supabaseUrl()).host)
  return fetch(input, { ...init, headers })
}
