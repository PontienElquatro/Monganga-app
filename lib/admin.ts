import 'server-only'
import { requireRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Client « service » pour les lectures d'administration que la RLS ne couvre pas
 * (commission des médecins). Toujours après vérification du rôle admin.
 * Jamais pour le contenu médical (ordonnances, notes, messages).
 */
export async function adminReader() {
  await requireRole('admin')
  return createAdminClient()
}
