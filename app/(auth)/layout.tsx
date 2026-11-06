import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-wrapper">
      <div className="auth-card" id="main-content" role="main">
        <Link className="auth-back" href="/"><Icon name="arrow-left" /> Retour à l’accueil</Link>
        <div className="auth-brand" style={{ marginTop: 18 }}>
          <div className="auth-brand-icon logo-image-wrap"><img src="/logo/monganga-icon-192.png" alt="" /></div>
          <span className="auth-brand-text">MONGANGA</span>
        </div>
        {children}
      </div>
    </div>
  )
}
