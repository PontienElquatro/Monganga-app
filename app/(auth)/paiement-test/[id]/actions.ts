'use server'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { modes } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { flushEmailsSoon } from '@/lib/services/notifications'

/** Joue le rôle du prestataire : confirme ou refuse le paiement, comme le ferait le webhook. */
export async function simulatePaymentAction(fd: FormData): Promise<void> {
  if (!modes.paymentsAreTest()) throw new Error('Simulation désactivée : un prestataire réel est branché.')
  await requireRole('patient')
  const id = String(fd.get('payment_id') ?? '')
  const ok = fd.get('resultat') === 'ok'
  // Lecture avec la session du patient : la RLS garantit qu'il s'agit de son paiement.
  const supabase = await createClient()
  const { data: p } = await supabase.from('payments').select('id, appointment_id, status').eq('id', id)
    .maybeSingle<{ id: string; appointment_id: string; status: string }>()
  if (!p) redirect('/patient/rendez-vous')
  if (p.status === 'en_attente') {
    const admin = createAdminClient()
    const { error } = ok
      ? await admin.rpc('confirm_payment', { p_payment: p.id, p_provider_ref: null, p_raw: { simulation: true } })
      : await admin.rpc('fail_payment', { p_payment: p.id, p_reason: 'paiement refusé (simulation)' })
    if (error) console.error('[paiement-test]', error)
    flushEmailsSoon()
  }
  redirect(`/patient/paiement/${p.appointment_id}?retour=${p.id}`)
}
