import 'server-only'
import { getSession } from '@/lib/auth'
import { modes } from '@/lib/config'
import { Icon } from '@/components/ui/icon'

/**
 * Bandeau réservé à l'administration : rappelle les services encore en mode test.
 * Les patients et les médecins ne voient jamais ces informations techniques.
 */
export async function ModeBanner() {
  const session = await getSession()
  if (session?.profile.role !== 'admin') return null
  const parts: string[] = []
  if (modes.paymentsAreTest()) parts.push('paiements simulés')
  if (modes.videoIsTest()) parts.push('visio simulée')
  if (modes.emailIsTest()) parts.push('e-mails non envoyés')
  if (!modes.photosEnabled()) parts.push('photos de profil désactivées')
  if (!parts.length) return null
  return (
    <p className="mode-banner" role="status"><Icon name="info" /> Mode test : {parts.join(', ')}. Aucun argent réel ne circule.</p>
  )
}
