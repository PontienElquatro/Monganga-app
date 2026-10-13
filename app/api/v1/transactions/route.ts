import { apiJson } from '@/lib/api/http'
import { requireApiSession, unavailable } from '@/lib/api/guard'
import { createClient } from '@/lib/supabase/server'
import { fullNames } from '@/lib/api/names'
import { toApiTransaction, type PaymentFullRow } from '@/lib/api/mappers'

export const dynamic = 'force-dynamic'

// GET /transactions -> Transaction[] : paiements du patient (les siens) ou de l'admin (tous, via la RLS).
// Médecin : liste vide tant que l'écran « mes gains » n'est pas branché sur ledger_entries, car il ne doit voir
// que sa part (70 %), jamais la commission ni les montants bruts de la plateforme (README backend, règle 7).
export async function GET() {
  const auth = await requireApiSession()
  if ('denied' in auth) return auth.denied
  const { session } = auth
  if (session.role === 'doctor') return apiJson([])

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('id, appointment_id, payer_id, type, amount, status, provider, provider_reference, created_at, appointments(doctor_id)')
    .order('created_at', { ascending: false })
  if (error) return unavailable()
  const rows = (data ?? []) as unknown as PaymentFullRow[]
  const names = session.role === 'patient' ? new Map([[session.id, session.name]]) : await fullNames(rows.map(r => r.payer_id))
  return apiJson(rows.map(row => toApiTransaction(row, names.get(row.payer_id) || 'Patient')))
}
