import type { PaymentKind, PaymentMethod } from '@/lib/types'

export interface InitiateInput {
  paymentId: string
  appointmentId: string
  kind: PaymentKind
  amountCents: number
  method: PaymentMethod
  phone: string | null
  description: string
  /** Où renvoyer le patient après le paiement. */
  returnUrl: string
  /** Adresse que le prestataire appelle pour confirmer (webhook). */
  callbackUrl: string
}

export type InitiateResult =
  | { kind: 'redirect'; url: string; providerRef?: string }
  | { kind: 'pending'; message: string; providerRef?: string }

export interface WebhookResult {
  paymentId: string
  providerRef: string | null
  status: 'reussi' | 'echoue'
  reason?: string
  raw: unknown
}

/**
 * Contrat commun à tous les prestataires de paiement.
 * Pour brancher un prestataire : implémenter ces deux fonctions, puis le déclarer dans index.ts.
 */
export interface PaymentProvider {
  name: string
  initiate(input: InitiateInput): Promise<InitiateResult>
  /** Vérifie l'authenticité de l'appel du prestataire et en extrait le résultat. */
  parseWebhook(request: Request): Promise<WebhookResult>
}
