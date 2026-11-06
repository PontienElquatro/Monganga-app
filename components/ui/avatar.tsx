import { initials } from '@/lib/format'

/** Photo de profil (Cloudinary) ou initiales sur le dégradé de la marque. */
export function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const cls = size === 'md' ? 'v3-avatar' : `v3-avatar ${size}`
  if (url) return <img className={cls} src={url} alt={`Photo de ${name}`} style={{ objectFit: 'cover' }} />
  return <span className={cls} aria-hidden="true">{initials(name)}</span>
}
