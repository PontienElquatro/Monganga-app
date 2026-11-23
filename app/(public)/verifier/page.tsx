import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'

export const metadata: Metadata = { title: 'Vérifier une ordonnance' }

/** Saisie manuelle du numéro d'ordonnance (pour le pharmacien qui ne scanne pas le QR code). */
export default async function VerifierSaisiePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  const clean = (code ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20)
  if (clean) redirect(`/verifier/${clean}`)
  return (
    <section className="container section">
      <div className="v3-verify panel">
        <div className="v3-icon-circle ok"><Icon name="qr-code" /></div>
        <h1>Vérifier une ordonnance</h1>
        <p className="muted">Scannez le QR code de l’ordonnance, ou saisissez son numéro (par exemple ORD-7K2P9X). Seule l’authenticité est affichée : aucune information médicale.</p>
        <form method="get" action="/verifier" className="stack" style={{ maxWidth: 360, margin: '0 auto' }}>
          <label className="sr-only" htmlFor="code">Numéro d’ordonnance</label>
          <input className="form-input" id="code" name="code" placeholder="ORD-XXXXXX" required maxLength={20} autoCapitalize="characters" />
          <button className="btn btn-primary" type="submit"><Icon name="search" /> Vérifier</button>
        </form>
      </div>
    </section>
  )
}
