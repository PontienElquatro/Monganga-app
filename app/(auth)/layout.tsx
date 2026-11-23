import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { getSession, homeFor } from '@/lib/auth'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Connecté : le retour mène à son espace (patient, médecin, administration), pas à l'accueil du site.
  const session = await getSession()
  const back = session ? { href: homeFor(session), label: 'Retour à mon espace' } : { href: '/', label: 'Retour à l’accueil' }
  return (
    <div className="auth-wrapper">
      <div className="auth-card" id="main-content" role="main">
        <Link className="auth-back" href={back.href}><Icon name="arrow-left" /> {back.label}</Link>
        <div className="auth-brand" style={{ marginTop: 18 }}>
          <div className="auth-brand-icon logo-image-wrap"><img src="/logo/monganga-icon-192.png" alt="" /></div>
          <span className="auth-brand-text">MONGANGA</span>
        </div>
        {children}
      </div>
    </div>
  )
}
