import 'server-only'
import { requireAdmin } from '@/lib/auth'
import type { AdminRole } from '@/lib/types'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Client « service » pour les lectures d'administration que la RLS ne couvre pas
 * (commission des médecins). Toujours après vérification du rôle admin.
 * Jamais pour le contenu médical (ordonnances, notes, messages).
 */
export async function adminReader(...roles: AdminRole[]) {
  await requireAdmin(...roles)
  return createAdminClient()
}
