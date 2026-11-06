import { createAdminClient } from '@/lib/supabase/admin'
import { providerByName } from '@/lib/services/paiement'
import { flushEmailQueue } from '@/lib/services/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Rappel du prestataire de paiement (webhook). C'est le SEUL chemin qui confirme un vrai paiement.
 * L'authenticité est vérifiée par le prestataire (parseWebhook), puis la base applique la règle :
 * acompte → rendez-vous confirmé ; solde → accès à la visio. Idempotent (un rappel peut arriver deux fois).
 */
export async function POST(request: Request, { params }: { params: Promise<{ fournisseur: string }> }) {
  const { fournisseur } = await params
  const provider = providerByName(fournisseur)
  if (!provider || provider.name === 'test') return new Response('Prestataire inconnu', { status: 404 })

  let result
  try {
    result = await provider.parseWebhook(request)
  } catch (e) {
    console.error(`[webhook ${fournisseur}] refusé`, e)
    return new Response('Signature invalide', { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = result.status === 'reussi'
    ? await admin.rpc('confirm_payment', { p_payment: result.paymentId, p_provider_ref: result.providerRef, p_raw: result.raw as object })
    : await admin.rpc('fail_payment', { p_payment: result.paymentId, p_reason: result.reason ?? 'refusé par le prestataire' })
  if (error) {
    console.error(`[webhook ${fournisseur}] base`, error)
    // 500 : le prestataire réessaiera plus tard.
    return new Response('Erreur', { status: 500 })
  }
  try { await flushEmailQueue(10) } catch (e) { console.error('[webhook] e-mails', e) }
  return Response.json({ ok: true })
}
