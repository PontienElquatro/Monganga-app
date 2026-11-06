import 'server-only'
import { modes } from '@/lib/config'
import { Icon } from '@/components/ui/icon'

/** Bandeau visible tant que des services tournent en mode test (disparaît une fois les API branchées). */
export function ModeBanner() {
  const parts: string[] = []
  if (modes.paymentsAreTest()) parts.push('paiements simulés')
  if (modes.videoIsTest()) parts.push('visio simulée')
  if (modes.emailIsTest()) parts.push('e-mails non envoyés')
  if (!parts.length) return null
  return (
    <p className="mode-banner" role="status"><Icon name="info" /> Mode test : {parts.join(', ')}. Aucun argent réel ne circule.</p>
  )
}
