import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/config'

/**
 * Client « service_role » : contourne la RLS.
 * À utiliser UNIQUEMENT côté serveur, pour : confirmer un paiement (webhook),
 * la tâche planifiée, l'envoi des e-mails, et des lectures d'administration
 * après vérification du rôle. Jamais dans un composant client.
 */
export function createAdminClient() {
  return createClient(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
