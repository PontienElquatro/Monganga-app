import 'server-only'
import type { PaymentProvider } from './types'

/**
 * MaishaPay — À BRANCHER quand le compte marchand sera ouvert.
 *
 * Ce qu'il faudra faire, avec la documentation remise par MaishaPay à l'ouverture du compte :
 *  1. initiate() : appeler l'API de paiement (Mobile Money : numéro + opérateur ; carte : page sécurisée)
 *     avec le montant en USD, la référence interne `paymentId` et l'URL de rappel `callbackUrl`.
 *     Renvoyer { kind: 'pending' } pour Mobile Money (le patient valide sur son téléphone)
 *     ou { kind: 'redirect', url } pour la carte.
 *  2. parseWebhook() : vérifier la signature / le secret (MAISHAPAY_CALLBACK_SECRET),
 *     retrouver `paymentId`, et renvoyer 'reussi' ou 'echoue'.
 * La confirmation en base (confirm_payment) est déjà faite par /api/paiements/webhook/maishapay.
 */
export const maishapayProvider: PaymentProvider = {
  name: 'maishapay',
  async initiate() {
    throw new Error('MaishaPay n’est pas encore branché. Laissez PAYMENT_PROVIDER=test en attendant le compte marchand.')
  },
  async parseWebhook() {
    throw new Error('MaishaPay n’est pas encore branché.')
  },
}
