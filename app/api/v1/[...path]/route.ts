import { apiError } from '@/lib/api/http'

export const dynamic = 'force-dynamic'

// Repli : toute route du contrat (docs/frontend/openapi.json) pas encore branchée sur Supabase
// répond 501 explicite. Les routes déjà branchées ont leur propre dossier et gagnent sur ce repli.
// Le front en mode « api » n'utilise jamais de données de démo : une erreur claire vaut mieux.
function notImplemented() {
  return apiError(501, 'NOT_IMPLEMENTED', 'Cette fonctionnalité n’est pas encore connectée au serveur.')
}

export { notImplemented as GET, notImplemented as POST, notImplemented as PUT, notImplemented as PATCH, notImplemented as DELETE }
