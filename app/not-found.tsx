import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

export default function NotFound() {
  return (
    <div className="auth-wrapper">
      <div className="auth-card v3-center" role="main">
        <div className="v3-icon-circle"><Icon name="search" /></div>
        <h1 className="auth-title">Page introuvable</h1>
        <p className="auth-subtitle">Cette page n’existe pas ou n’est plus disponible.</p>
        <Link className="btn btn-primary btn-block" href="/espace"><Icon name="house" /> Retour à mon espace</Link>
        <Link className="btn btn-ghost btn-block" href="/">Accueil MONGANGA</Link>
      </div>
    </div>
  )
}
