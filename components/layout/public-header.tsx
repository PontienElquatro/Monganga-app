'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/ui/logo'
import { Icon, type IconName } from '@/components/ui/icon'
import { ThemeToggle } from './theme-toggle'

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: '/', label: 'Accueil', icon: 'house' },
  { href: '/comment-ca-marche', label: 'Comment ça marche', icon: 'book-open' },
  { href: '/medecins', label: 'Médecins', icon: 'stethoscope' },
  { href: '/tarifs', label: 'Tarifs', icon: 'tag' },
  { href: '/faq', label: 'FAQ', icon: 'circle-alert' },
]

export function PublicHeader({ spaceHref }: { spaceHref: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const active = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))
  return (
    <>
      <header className="pub-header">
        <div className="pub-header-inner">
          <Logo />
          <nav className="pub-nav" aria-label="Navigation principale">
            {LINKS.map((l) => (
              <Link key={l.href} className={`pub-nav-link${active(l.href) ? ' active' : ''}`} href={l.href} aria-current={active(l.href) ? 'page' : undefined}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="pub-actions">
            <ThemeToggle />
            {spaceHref ? (
              <Link className="btn btn-primary btn-sm" href={spaceHref}>Mon espace</Link>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm" href="/connexion">Se connecter</Link>
                <Link className="btn btn-primary btn-sm" href="/inscription">S’inscrire</Link>
              </>
            )}
            <button className="mobile-menu-btn" onClick={() => setOpen(true)} aria-label="Ouvrir le menu" aria-expanded={open}>
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>
      <div className={`drawer-overlay${open ? ' active' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer${open ? ' active' : ''}`} style={{ width: 280 }} aria-hidden={!open}>
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
          <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Fermer le menu"><Icon name="x" /></button>
        </div>
        <div className="drawer-content">
          {LINKS.map((l) => (
            <Link key={l.href} className="menu-link" href={l.href} onClick={() => setOpen(false)}><Icon name={l.icon} /> {l.label}</Link>
          ))}
          <Link className="menu-link" href="/contact" onClick={() => setOpen(false)}><Icon name="mail" /> Contact</Link>
          <Link className="menu-link" href="/inscription?type=medecin" onClick={() => setOpen(false)}><Icon name="user-plus" /> Devenir médecin</Link>
          <div style={{ marginTop: 'auto', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {spaceHref ? (
              <Link className="btn btn-primary btn-block" href={spaceHref}>Mon espace</Link>
            ) : (
              <>
                <Link className="btn btn-secondary btn-block" href="/connexion">Se connecter</Link>
                <Link className="btn btn-primary btn-block" href="/inscription">S’inscrire</Link>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
