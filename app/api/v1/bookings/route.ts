import { type NextRequest } from 'next/server'
import { apiError, apiJson, guardMutation, readJson } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { loadBookings } from '@/lib/api/bookings'
import { mapRpcError } from '@/lib/api/rpc-errors'
import { UUID_RE } from '@/lib/api/doctors'

export const dynamic = 'force-dynamic'

// GET /bookings -> Booking[] : uniquement les rendez-vous du compte (la RLS de `appointments` fait foi).
export async function GET() {
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  try { return apiJson(await loadBookings(auth.session)) } catch { return unavailable() }
}

// POST /bookings { doctorId, slot } -> Booking (créneau retenu 30 min en attente du paiement).
// Passe uniquement par la fonction SQL book_appointment (jamais d'insert direct dans `appointments`) :
// réservation atomique, pas de double réservation, médecin validé, créneau futur.
export async function POST(request: NextRequest) {
  const blocked = guardMutation(request)
  if (blocked) return blocked
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const { session } = auth
  if (session.role !== 'patient') return apiError(403, 'FORBIDDEN', 'Seul un patient peut réserver un rendez-vous.')

  const body = await readJson(request)
  const doctorId = typeof body?.doctorId === 'string' ? body.doctorId : ''
  const slotMs = typeof body?.slot === 'string' ? Date.parse(body.slot) : NaN
  if (!UUID_RE.test(doctorId) || !Number.isFinite(slotMs)) {
    return apiError(400, 'VALIDATION', 'Choisissez un médecin et un créneau valides.', { slot: 'Choisissez un autre horaire.' })
  }
  const SLOT_GONE = () => apiError(409, 'SLOT_UNAVAILABLE', 'Ce créneau n’est plus disponible.', { slot: 'Choisissez un autre horaire.' })

  const supabase = await createClient()
  const { data: availability, error: availabilityError } = await supabase
    .from('availabilities').select('id, is_booked').eq('doctor_id', doctorId).eq('start_time', new Date(slotMs).toISOString()).maybeSingle()
  if (availabilityError) return unavailable()
  if (!availability) return SLOT_GONE()

  // Double envoi : si ce patient retient déjà ce créneau (en attente de paiement), on renvoie la même réservation.
  const { data: existing } = await supabase
    .from('appointments').select('id').eq('availability_id', availability.id).eq('patient_id', session.id).eq('status', 'en_attente').maybeSingle()
  let bookingId = existing?.id as string | undefined

  if (!bookingId) {
    if (availability.is_booked) return SLOT_GONE()
    const { data, error } = await supabase.rpc('book_appointment', { p_availability_id: availability.id })
    if (error) {
      const failure = mapRpcError(error)
      if (!failure) return unavailable()
      return failure.status === 403 ? apiError(403, failure.code, failure.message) : apiError(409, 'SLOT_UNAVAILABLE', failure.message, { slot: 'Choisissez un autre horaire.' })
    }
    bookingId = data as string
  }

  try {
    const [booking] = await loadBookings(session, bookingId)
    return booking ? apiJson(booking, 201) : unavailable()
  } catch { return unavailable() }
}
