import Link from 'next/link'

export function Logo({ href = '/', className = 'logo' }: { href?: string; className?: string }) {
  return (
    <Link className={className} href={href} aria-label="MONGANGA, accueil">
      <div className="logo-icon logo-image-wrap">
        <img src="/logo/monganga-icon-192.png" alt="" width={38} height={38} />
      </div>
      <span className="logo-text">MONGANGA</span>
    </Link>
  )
}
