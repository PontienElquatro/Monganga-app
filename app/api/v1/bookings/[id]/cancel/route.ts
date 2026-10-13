import { type NextRequest } from 'next/server'
import { apiError, apiJson, guardMutation, readJson } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { loadBookings } from '@/lib/api/bookings'
import { mapRpcError } from '@/lib/api/rpc-errors'
import { UUID_RE } from '@/lib/api/doctors'

export const dynamic = 'force-dynamic'

// POST /bookings/{id}/cancel { reason } -> Booking annulé (RPC cancel_appointment : règle des 24 h pour le
// patient, créneau libéré, remboursement mock si la réservation était payée).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = guardMutation(request)
  if (blocked) return blocked
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const { id } = await params
  if (!UUID_RE.test(id)) return apiError(404, 'NOT_FOUND', 'Rendez-vous introuvable.')

  const body = await readJson(request)
  const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  if (!reason || reason.length > 1000) return apiError(400, 'VALIDATION', 'Indiquez le motif de l’annulation.', { reason: 'Motif obligatoire (1000 caractères maximum).' })

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_appointment', { p_appointment_id: id, p_reason: reason })
  if (error) {
    const failure = mapRpcError(error)
    return failure ? apiError(failure.status, failure.code, failure.message) : unavailable()
  }
  try {
    const [booking] = await loadBookings(auth.session, id)
    return booking ? apiJson(booking) : unavailable()
  } catch { return unavailable() }
}
