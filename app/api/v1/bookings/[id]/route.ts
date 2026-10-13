import { apiError, apiJson } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { loadBookings } from '@/lib/api/bookings'
import { UUID_RE } from '@/lib/api/doctors'

export const dynamic = 'force-dynamic'

// GET /bookings/{id} -> Booking. 404 si absent OU interdit (on ne révèle pas l'existence du rendez-vous d'un autre).
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
