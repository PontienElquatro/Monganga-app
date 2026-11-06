import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { SubmitButton } from '@/components/ui/form'
import { requireRole } from '@/lib/auth'
import { modes } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'
import { paymentLabel, usd } from '@/lib/format'
import { simulatePaymentAction } from './actions'
import type { PaymentKind, PaymentMethod, PaymentStatus } from '@/lib/types'

export const metadata: Metadata = { title: 'Paiement de test', robots: { index: false } }

/**
 * Simulateur de paiement : remplace la page du prestataire tant que PAYMENT_PROVIDER=test.
 * Disparaît automatiquement (404) quand un vrai prestataire est branché.
 */
export default async function PaiementTestPage({ params }: { params: Promise<{ id: string }> }) {
  if (!modes.paymentsAreTest()) notFound()
  await requireRole('patient')
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const supabase = await createClient()
  const { data: p } = await supabase
    .from('payments')
    .select('id, appointment_id, kind, status, method, phone, amount_cents')
    .eq('id', id)
    .maybeSingle<{ id: string; appointment_id: string; kind: PaymentKind; status: PaymentStatus; method: PaymentMethod; phone: string | null; amount_cents: number }>()
  if (!p) notFound()

  return (
    <div className="stack">
      <p className="notice warning"><Icon name="info" /> <span><strong>Paiement de test.</strong> Aucun argent ne circule. Cette page remplace celle du prestataire (M-Pesa, Orange Money, Airtel Money, carte) tant que l’API de paiement n’est pas branchée.</span></p>
      <h1 className="auth-title">{p.kind === 'acompte' ? 'Acompte de réservation' : 'Solde de la consultation'}</h1>
      <div className="v3-summary">
        <div className="total"><span>Montant</span><strong>{usd(p.amount_cents)}</strong></div>
        <div><span>Moyen</span><strong>{paymentLabel(p.method)}</strong></div>
        {p.phone ? <div><span>Numéro</span><strong>{p.phone}</strong></div> : null}
      </div>
      {p.status === 'en_attente' ? (
        <form action={simulatePaymentAction} className="stack">
          <input type="hidden" name="payment_id" value={p.id} />
          <SubmitButton className="btn btn-primary btn-lg btn-block" icon="circle-check" name="resultat" value="ok">Simuler un paiement réussi</SubmitButton>
          <SubmitButton className="btn btn-secondary btn-block" icon="circle-x" name="resultat" value="echec">Simuler un échec</SubmitButton>
        </form>
      ) : (
        <p className="notice">Ce paiement est déjà traité ({p.status}).</p>
      )}
    </div>
  )
}
