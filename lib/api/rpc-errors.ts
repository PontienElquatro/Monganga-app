// Les fonctions SQL de réservation lèvent des exceptions aux messages déjà rédigés en français
// pour l'utilisateur (README backend §7). On les traduit en erreurs HTTP du contrat ; toute autre
// erreur (réseau, base) reste générique pour ne rien divulguer. Pure : testable seule.

export type RpcFailure = { status: 403 | 404 | 409; code: 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT'; message: string }

export function mapRpcError(error: { code?: string | null; message?: string | null } | null | undefined): RpcFailure | null {
  if (!error || error.code !== 'P0001') return null // P0001 = « raise exception » écrit par Junior
  const message = (error.message ?? '').trim()
  if (!message) return null
  if (/introuvable/i.test(message)) return { status: 404, code: 'NOT_FOUND', message }
  if (/pas autorisé|ne vous appartient pas|Seul/i.test(message)) return { status: 403, code: 'FORBIDDEN', message }
  return { status: 409, code: 'CONFLICT', message }
}
