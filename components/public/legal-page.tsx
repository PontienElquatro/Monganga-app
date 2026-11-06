import Link from 'next/link'
import { Icon } from '@/components/ui/icon'

export function LegalPage({ title, intro, updated, children }: { title: string; intro: string; updated: string; children: React.ReactNode }) {
  return (
    <section className="container section">
      <div className="legal">
        <div className="breadcrumb mb-3"><Link href="/">Accueil</Link><Icon name="chevron-right" /><span>{title}</span></div>
        <h1 className="h1 mb-4">{title}</h1>
        <p className="text-2" style={{ marginBottom: 8 }}>{intro}</p>
        <p className="meta" style={{ marginBottom: 24 }}>Dernière mise à jour : {updated}</p>
        {children}
      </div>
    </section>
  )
}
