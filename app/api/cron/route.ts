import { env } from '@/lib/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { flushEmailQueue } from '@/lib/services/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Tâche planifiée (Vercel Cron, toutes les 5 minutes) :
 *  1. tick() en base (si pg_cron n'est pas actif sur le projet Supabase) ;
 *  2. envoi des e-mails des notifications en attente ;
 *  3. suppression des documents de consultation de plus de 30 jours (Storage + base).
 * Protégée par CRON_SECRET (Vercel envoie « Authorization: Bearer <CRON_SECRET> »).
 */
export async function GET(request: Request) {
  const secret = env.cronSecret()
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Accès refusé', { status: 401 })
  }
  const admin = createAdminClient()
  const report: Record<string, unknown> = {}

  const tick = await admin.rpc('tick')
  report.tick = tick.error ? `erreur : ${tick.error.message}` : tick.data

  try { report.emails = await flushEmailQueue(60) } catch (e) { report.emails = `erreur : ${String(e)}` }

  // Documents échangés en consultation : supprimés 30 jours après le rendez-vous.
  const { data: keep } = await admin.from('settings').select('value').eq('key', 'conservation_jours').maybeSingle<{ value: number }>()
  const limit = new Date(Date.now() - Number(keep?.value ?? 30) * 86_400_000).toISOString()
  const { data: old } = await admin.from('consultation_files')
    .select('id, storage_path, appointments!inner(starts_at)')
    .lt('appointments.starts_at', limit)
    .limit(200)
  const files = (old ?? []) as unknown as { id: string; storage_path: string }[]
  if (files.length) {
    const removed = await admin.storage.from('consultations').remove(files.map((f) => f.storage_path))
    if (!removed.error) {
      await admin.from('consultation_files').delete().in('id', files.map((f) => f.id))
      report.fichiers_supprimes = files.length
    } else {
      report.fichiers_supprimes = `erreur : ${removed.error.message}`
    }
  }
  return Response.json(report)
}
