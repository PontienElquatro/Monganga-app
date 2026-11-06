import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const cell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = (rows: unknown[][]) => '﻿' + rows.map((r) => r.map(cell).join(';')).join('\n')
const dollars = (c: number) => (c / 100).toFixed(2).replace('.', ',')

/** Exports comptables (12 derniers mois) pour l'administration. Aucun contenu médical. */
export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin' || session.profile.suspended_at) return new Response('Accès refusé', { status: 403 })
  const type = new URL(request.url).searchParams.get('type')
  const since = new Date(Date.now() - 365 * 86_400_000).toISOString()
  const supabase = await createClient()
  let body: string
  if (type === 'paiements') {
    const { data } = await supabase.from('payments')
      .select('created_at, paid_at, kind, amount_cents, method, provider, provider_ref, status, appointments!inner(reference)')
      .gte('created_at', since).order('created_at')
    body = csv([['Créé le', 'Payé le', 'Type', 'Montant (USD)', 'Moyen', 'Prestataire', 'Référence prestataire', 'État', 'RDV'],
      ...((data ?? []) as unknown as { created_at: string; paid_at: string | null; kind: string; amount_cents: number; method: string; provider: string; provider_ref: string | null; status: string; appointments: { reference: string } }[])
        .map((p) => [p.created_at, p.paid_at, p.kind, dollars(p.amount_cents), p.method, p.provider, p.provider_ref, p.status, p.appointments.reference])])
  } else if (type === 'repartition') {
    const { data } = await supabase.from('ledger_entries')
      .select('created_at, type, reason, amount_cents, payout_id, appointments!inner(reference)')
      .gte('created_at', since).order('created_at')
    body = csv([['Date', 'Part', 'Motif', 'Montant (USD)', 'Versé', 'RDV'],
      ...((data ?? []) as unknown as { created_at: string; type: string; reason: string; amount_cents: number; payout_id: string | null; appointments: { reference: string } }[])
        .map((l) => [l.created_at, l.type === 'part_medecin' ? 'médecin' : 'plateforme', l.reason, dollars(l.amount_cents), l.type === 'part_medecin' ? (l.payout_id ? 'oui' : 'non') : '', l.appointments.reference])])
  } else {
    return new Response('Type inconnu', { status: 400 })
  }
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="monganga-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
