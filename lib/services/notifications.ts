import 'server-only'
import { after } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/services/email'

/**
 * Envoie les e-mails des notifications en attente (file « notifications » de la base).
 * Appelé après les actions importantes et par la tâche planifiée /api/cron.
 */
export async function flushEmailQueue(limit = 40): Promise<number> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notifications')
    .select('id, title, body, link, user_id, profiles!inner(email, suspended_at)')
    .eq('send_email', true)
    .is('emailed_at', null)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error || !data) return 0

  let sent = 0
  for (const n of data as unknown as Array<{ id: string; title: string; body: string; link: string | null; profiles: { email: string; suspended_at: string | null } }>) {
    const email = n.profiles?.email
    let ok = true
    if (email && !n.profiles.suspended_at) {
      ok = await sendEmail({ to: email, subject: `MONGANGA — ${n.title}`, title: n.title, body: n.body, link: n.link })
    }
    if (ok) {
      await admin.from('notifications').update({ emailed_at: new Date().toISOString() }).eq('id', n.id)
      sent++
    }
  }
  return sent
}

/**
 * Version « sans attendre » : l'envoi part après la réponse au navigateur
 * (after() garde la fonction active sur Vercel) et n'échoue jamais l'action en cours.
 */
export function flushEmailsSoon(): void {
  after(async () => {
    try { await flushEmailQueue(20) } catch (e) { console.error('[e-mail] file', e) }
  })
}
