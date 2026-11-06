'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Icon, type IconName } from '@/components/ui/icon'
import { Avatar } from '@/components/ui/avatar'
import { ThemeToggle } from './theme-toggle'
import { NotificationsBell } from './notifications-bell'

export interface ProNavItem { href: string; label: string; icon: IconName; exact?: boolean }

/** Coque des espaces médecin et administration (barre latérale). */
export function ProShell({ space, nav, user, userId, unread, banner, children }: {
  space: string
  nav: ProNavItem[]
  user: { name: string; detail: string; avatar: string | null; href: string }
  userId: string
  unread: number
  banner?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (item: ProNavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/'))
  return (
    <div className={`doctor-body restored-space${open ? ' workspace-sidebar-open' : ''}`}>
      {banner}
      <div className="doctor-shell">
        <aside className="doctor-sidebar" id="workspace-sidebar">
          <div className="doctor-brand">
            <div className="doctor-brand-mark logo-image-wrap"><img src="/logo/monganga-icon-192.png" alt="" /></div>
            <div className="doctor-brand-text"><strong>MONGANGA</strong><span>{space}</span></div>
          </div>
          <nav className="doctor-nav" aria-label="Navigation principale">
            {nav.map((item) => (
              <Link key={item.href} className={`doctor-nav-link${isActive(item) ? ' active' : ''}`} href={item.href}
                    aria-current={isActive(item) ? 'page' : undefined} onClick={() => setOpen(false)}>
                <Icon name={item.icon} /> {item.label}
              </Link>
            ))}
          </nav>
          <Link className="doctor-profile-box" href={user.href} aria-label="Ouvrir mon profil">
            <div className="doctor-mini-user">
              <Avatar name={user.name} url={user.avatar} size="sm" />
              <div className="doctor-mini-meta"><strong>{user.name}</strong><span>{user.detail}</span></div>
            </div>
          </Link>
          <div className="sidebar-controls">
            <ThemeToggle />
            <NotificationsBell userId={userId} initialUnread={unread} />
            <form action="/auth/deconnexion" method="post">
              <button className="btn btn-ghost btn-icon" type="submit" aria-label="Se déconnecter"><Icon name="log-out" /></button>
            </form>
            <button className="btn btn-ghost btn-icon workspace-menu-btn" type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu"><Icon name="x" /></button>
          </div>
        </aside>
        <main id="main-content" className="doctor-main" tabIndex={-1}>
          <button className="btn btn-secondary btn-sm workspace-menu-btn" type="button" onClick={() => setOpen(true)} aria-controls="workspace-sidebar" aria-expanded={open}>
            <Icon name="menu" /> Menu
          </button>
          {children}
        </main>
      </div>
      <div className="workspace-sidebar-overlay" onClick={() => setOpen(false)} aria-hidden="true" />
    </div>
  )
}
