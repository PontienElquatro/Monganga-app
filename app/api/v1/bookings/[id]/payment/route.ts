import { type NextRequest } from 'next/server'
import { apiError, apiJson, guardMutation, readJson } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { loadBookings } from '@/lib/api/bookings'
import { mapRpcError } from '@/lib/api/rpc-errors'
import { UUID_RE } from '@/lib/api/doctors'

export const dynamic = 'force-dynamic'

const METHODS = ['M-Pesa', 'Airtel Money', 'Orange Money', 'Visa', 'Mastercard']

// GET /bookings/{id}/payment -> Booking (état autoritaire du paiement, relu depuis la base).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const { id } = await params
  if (!UUID_RE.test(id)) return apiError(404, 'NOT_FOUND', 'Rendez-vous introuvable.')
  try {
    const [booking] = await loadBookings(auth.session, id)
    return booking ? apiJson(booking) : apiError(404, 'NOT_FOUND', 'Rendez-vous introuvable.')
  } catch { return unavailable() }
}

// POST /bookings/{id}/payment { method, phone? } -> Booking.
// PAIEMENT SIMULÉ (README backend, règle 8) : pay_reservation_mock confirme la réservation de 1 $ sans aucun
// débit réel. Aucun opérateur n'est appelé. Appel répété sur un rendez-vous déjà payé : renvoie l'état actuel.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = guardMutation(request)
  if (blocked) return blocked
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const { id } = await params
  if (!UUID_RE.test(id)) return apiError(404, 'NOT_FOUND', 'Rendez-vous introuvable.')

  const body = await readJson(request)
  if (typeof body?.method !== 'string' || !METHODS.includes(body.method)) {
    return apiError(400, 'VALIDATION', 'Choisissez un moyen de paiement.', { method: 'Moyen de paiement invalide.' })
  }

  let current
  try { [current] = await loadBookings(auth.session, id) } catch { return unavailable() }
  if (!current) return apiError(404, 'NOT_FOUND', 'Rendez-vous introuvable.')
  if (current.status === 'confirmed' && current.paymentStatus === 'paid') return apiJson(current) // idempotent

  const supabase = await createClient()
  const { error } = await supabase.rpc('pay_reservation_mock', { p_appointment_id: id })
  if (error) {
    const failure = mapRpcError(error)
    return failure ? apiError(failure.status, failure.code, failure.message) : unavailable()
  }
  try {
    const [booking] = await loadBookings(auth.session, id)
    return booking ? apiJson(booking) : unavailable()
  } catch { return unavailable() }
}
