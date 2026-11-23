import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { kinDayStart, todayKinshasa } from '@/lib/format'
import type { AgendaItem } from '@/lib/types'

/** Agenda du médecin connecté entre deux jours de Kinshasa (fin exclue). */
export async function getAgenda(fromDay: string, toDay: string): Promise<AgendaItem[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('doctor_agenda', { p_from: kinDayStart(fromDay), p_to: kinDayStart(toDay) })
  return (data ?? []) as AgendaItem[]
}

export const todayAgenda = () => getAgenda(todayKinshasa(), todayKinshasa(1))

export interface LedgerRow { id: string; appointment_id: string; reason: string; amount_cents: number; payout_id: string | null; created_at: string }
export interface PayoutRow { id: string; period_end: string; amount_cents: number; fees_cents: number; net_cents: number; method: string; account: string; status: 'a_verser' | 'verse'; reference: string | null; paid_at: string | null }

/** Part du médecin uniquement (la RLS ne renvoie jamais la part de la plateforme). */
export async function getEarnings() {
  const supabase = await createClient()
  const [ledger, payouts] = await Promise.all([
    supabase.from('ledger_entries').select('id, appointment_id, reason, amount_cents, payout_id, created_at').eq('type', 'part_medecin').order('created_at', { ascending: false }).limit(500),
    supabase.from('payouts').select('id, period_end, amount_cents, fees_cents, net_cents, method, account, status, reference, paid_at').order('period_end', { ascending: false }).limit(100),
  ])
  return { ledger: (ledger.data ?? []) as LedgerRow[], payouts: (payouts.data ?? []) as PayoutRow[] }
}

/** Samedi prochain (jour des versements), au format AAAA-MM-JJ. */
export function nextSaturday(): string {
  const today = todayKinshasa()
  const d = new Date(`${today}T12:00:00+01:00`)
  const add = (6 - d.getUTCDay() + 7) % 7
  return todayKinshasa(add)
}

/** Le patient peut être joint dans la salle de 5 min avant à 10 min après la fin. */
export function roomOpen(a: { starts_at: string; ends_at: string; status: string }, closeMinutes = 10, now = Date.now()): boolean {
  return (a.status === 'confirme' || a.status === 'en_cours') &&
    now >= new Date(a.starts_at).getTime() - 5 * 60_000 &&
    now <= new Date(a.ends_at).getTime() + closeMinutes * 60_000
}
