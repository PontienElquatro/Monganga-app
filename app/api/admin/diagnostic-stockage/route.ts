import { getSession, hasAdminRole } from '@/lib/auth'
import { env } from '@/lib/config'

export const dynamic = 'force-dynamic'

/**
 * Diagnostic du stockage privé (réservé au super administrateur).
 * Teste plusieurs façons de joindre le stockage depuis le serveur et renvoie les réponses.
 * Aucun secret n'est affiché : seulement l'adresse publique du projet et les codes de réponse.
 */
export async function GET() {
  const session = await getSession()
  if (!session || session.profile.suspended_at || !hasAdminRole(session, 'super')) return new Response('Accès refusé', { status: 403 })

  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = env.serviceRoleKey()
  const url = new URL(env.supabaseUrl())
  const host = url.host
  const ref = host.split('.')[0]
  const auth = { apikey: key, Authorization: `Bearer ${key}` }

  async function probe(label: string, target: string, headers: Record<string, string>) {
    try {
      const res = await fetch(target, { headers, cache: 'no-store' })
      return { label, target, status: res.status, body: (await res.text()).slice(0, 300) }
    } catch (e) {
      return { label, target, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const base = `${url.protocol}//${host}`
  const results = await Promise.all([
    probe('1. stockage, sans en-tête ajouté', `${base}/storage/v1/bucket`, auth),
    probe('2. stockage, avec x-forwarded-host', `${base}/storage/v1/bucket`, { ...auth, 'x-forwarded-host': host }),
    probe('3. stockage, adresse dédiée', `https://${ref}.storage.supabase.co/storage/v1/bucket`, auth),
    probe('4. stockage, adresse dédiée (v1)', `https://${ref}.storage.supabase.co/v1/bucket`, auth),
    probe('5. base de données (témoin)', `${base}/rest/v1/doctor_profiles?select=id&limit=1`, auth),
    probe('6. en-têtes vus de l’extérieur', 'https://httpbin.org/headers', { 'x-forwarded-host': host }),
  ])

  const report = {
    adresse_projet: host,
    adresse_brute_longueur: raw.length,
    adresse_brute_nettoyee_longueur: raw.trim().length,
    adresse_brute_finit_par_slash: raw.trim().endsWith('/'),
    adresse_brute_chemin: url.pathname,
    format_cle_serveur: key.startsWith('sb_secret_') ? 'nouvelle clé secrète (sb_secret_…)' : key.startsWith('eyJ') ? 'ancienne clé service_role (JWT)' : 'format inconnu',
    resultats: results,
  }
  return new Response(JSON.stringify(report, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } })
}
