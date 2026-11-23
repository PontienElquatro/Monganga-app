import { redirect } from 'next/navigation'
import { getSession, homeFor } from '@/lib/auth'

/** Redirige chaque utilisateur vers son espace (patient, médecin, dossier ou administration). */
export default async function EspacePage() {
  const session = await getSession()
  redirect(session ? homeFor(session) : '/connexion')
}
