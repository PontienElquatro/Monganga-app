import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/config'

/** Client Supabase côté serveur, avec la session de l'utilisateur (la RLS s'applique). */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Appel depuis un composant serveur : le proxy rafraîchit déjà la session.
        }
      },
    },
  })
}
