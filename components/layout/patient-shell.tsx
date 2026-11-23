'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Logo } from '@/components/ui/logo'
import { Icon, type IconName } from '@/components/ui/icon'
import { ThemeToggle } from './theme-toggle'
import { NotificationsBell } from './notifications-bell'

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/patient', label: 'Accueil', icon: 'house' },
  { href: '/patient/recherche', label: 'Rechercher', icon: 'search' },
  { href: '/patient/rendez-vous', label: 'Mes RDV', icon: 'calendar' },
  { href: '/patient/ordonnances', label: 'Ordonnances', icon: 'file-text' },
  { href: '/patient/profil', label: 'Profil', icon: 'user' },
]

export function PatientShell({ userId, unread, banner, children }: { userId: string; unread: number; banner?: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => (href === '/patient' ? pathname === '/patient' : pathname.startsWith(href))
  return (
    <div className="pat-shell">
      {banner}
      <header className="pat-header">
        <div className="pat-header-inner">
          <Logo href="/patient" />
          <nav className="pat-nav" aria-label="Navigation de l’espace patient">
            {NAV.map((l) => (
              <Link key={l.href} className={`pat-nav-link${isActive(l.href) ? ' active' : ''}`} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}>
                <Icon name={l.icon} /> {l.label}
              </Link>
            ))}
          </nav>
          <div className="pat-header-actions">
            <ThemeToggle />
            <NotificationsBell userId={userId} initialUnread={unread} />
            <form action="/auth/deconnexion" method="post">
              <button className="btn btn-ghost btn-icon" type="submit" aria-label="Se déconnecter"><Icon name="log-out" /></button>
            </form>
          </div>
        </div>
      </header>
      <div className={`pat-menu-overlay${open ? ' active' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`pat-menu${open ? ' active' : ''}`} aria-hidden={!open}>
        <div className="pat-menu-header">
          <span style={{ fontWeight: 800 }}>Menu</span>
          <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Fermer"><Icon name="x" /></button>
        </div>
        <div className="pat-menu-content">
          {NAV.map((l) => (
            <Link key={l.href} className={`pat-menu-item${isActive(l.href) ? ' active' : ''}`} href={l.href} onClick={() => setOpen(false)}>
              <Icon name={l.icon} /> {l.label}
            </Link>
          ))}
        </div>
      </aside>
      <main id="main-content" className="pat-main" tabIndex={-1}>
        <div className="pat-content">{children}</div>
      </main>
      <nav className="pat-mobile-nav" aria-label="Navigation mobile">
        {NAV.map((l) => (
          <Link key={l.href} className={`pat-mobile-item${isActive(l.href) ? ' active' : ''}`} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}>
            <Icon name={l.icon} /><span>{l.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
