import { type NextRequest } from 'next/server'
import { apiError, apiJson, guardMutation } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { loadBookings } from '@/lib/api/bookings'
import { mapRpcError } from '@/lib/api/rpc-errors'
import { UUID_RE } from '@/lib/api/doctors'

export const dynamic = 'force-dynamic'

// POST /bookings/{id}/payment/cancel : le patient abandonne le paiement d'une réservation pas encore payée.
// La base n'a pas d'état « brouillon » : le rendez-vous est annulé et le créneau libéré (cancel_appointment).
// Refusé si la réservation est déjà payée (il faut alors annuler le rendez-vous, avec la règle des 24 h).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = guardMutation(request)
  if (blocked) return blocked
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const { id } = await params
  if (!UUID_RE.test(id)) return apiError(404, 'NOT_FOUND', 'Rendez-vous introuvable.')

  let current
  try { [current] = await loadBookings(auth.session, id) } catch { return unavailable() }
  if (!current) return apiError(404, 'NOT_FOUND', 'Rendez-vous introuvable.')
  if (current.status === 'cancelled') return apiJson(current) // idempotent
  if (current.status !== 'payment_pending' || current.paymentStatus === 'paid') {
    return apiError(409, 'CONFLICT', 'Ce paiement ne peut plus être annulé. Annulez plutôt le rendez-vous.')
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_appointment', { p_appointment_id: id, p_reason: 'Paiement abandonné par le patient' })
  if (error) {
    const failure = mapRpcError(error)
    return failure ? apiError(failure.status, failure.code, failure.message) : unavailable()
  }
  try {
    const [booking] = await loadBookings(auth.session, id)
    return booking ? apiJson(booking) : unavailable()
  } catch { return unavailable() }
}
