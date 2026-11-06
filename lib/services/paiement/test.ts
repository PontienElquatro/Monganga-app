import 'server-only'
import type { PaymentProvider } from './types'

/**
 * Prestataire de TEST : aucun argent ne circule.
 * Le patient arrive sur /paiement-test/<id>, où il simule un paiement réussi ou échoué.
 * Actif uniquement si PAYMENT_PROVIDER=test.
 */
export const testProvider: PaymentProvider = {
  name: 'test',
  async initiate(input) {
    return { kind: 'redirect', url: `/paiement-test/${input.paymentId}`, providerRef: `TEST-${input.paymentId.slice(0, 8).toUpperCase()}` }
  },
  async parseWebhook() {
    throw new Error('Le prestataire de test ne reçoit pas de webhook.')
  },
}
