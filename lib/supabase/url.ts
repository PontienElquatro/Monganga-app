/**
 * Adresse du projet Supabase, nettoyée : espaces, barre finale et point final du nom de domaine
 * (« …supabase.co. ») sont retirés. Le stockage de fichiers refuse une adresse terminée par un point
 * (« Invalid tenant id »), alors que la base de données l'accepte.
 */
export function cleanSupabaseUrl(value: string): string {
  const url = new URL(value.trim())
  url.hostname = url.hostname.replace(/\.+$/, '')
  return url.origin
}
