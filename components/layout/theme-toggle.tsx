'use client'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/icon'

export function ThemeToggle({ className = 'btn btn-ghost btn-icon' }: { className?: string }) {
  const [dark, setDark] = useState(false)
  useEffect(() => { setDark(document.documentElement.getAttribute('data-theme') === 'dark') }, [])
  function toggle() {
    const next = !dark
    setDark(next)
    if (next) document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
    try { localStorage.setItem('monganga-theme', next ? 'dark' : 'light') } catch { /* stockage indisponible */ }
  }
  return (
    <button type="button" className={className} onClick={toggle} aria-label={dark ? 'Passer en thème clair' : 'Passer en thème sombre'}>
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}
