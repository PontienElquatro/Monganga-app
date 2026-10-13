import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Noms complets des comptes `ids`. `profiles` n'est lisible que par son propriétaire (RLS) : pour afficher
 * le nom d'un patient à son médecin, on lit uniquement `full_name` avec le client admin, et seulement pour des
 * identifiants déjà autorisés par la RLS d'une autre table (rendez-vous, ordonnances). Jamais d'email ni de téléphone.
 */
export async function fullNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean)
  const map = new Map<string, string>()
  if (!unique.length) return map
  const { data } = await createAdminClient().from('profiles').select('id, full_name').in('id', unique)
  for (const row of data ?? []) map.set(row.id, (row.full_name ?? '').trim())
  return map
}
