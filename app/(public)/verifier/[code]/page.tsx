import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Icon } from '@/components/ui/icon'
import { dateLong } from '@/lib/format'

export const metadata: Metadata = { title: 'Vérifier une ordonnance', robots: { index: false } }

/** Page ouverte par le QR code de l'ordonnance : authenticité seulement, aucune donnée médicale. */
export default async function VerifierPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const { data } = await supabase.rpc('verify_prescription', { p_code: decodeURIComponent(code).slice(0, 20) })
  const rx = (data as { code: string; issued_at: string; expires_at: string; valid: boolean }[] | null)?.[0]
  return (
    <section className="container section">
      <div className="v3-verify panel">
        {rx ? (
          <>
            <div className={`v3-icon-circle ${rx.valid ? 'ok' : 'warn'}`}><Icon name={rx.valid ? 'badge-check' : 'hourglass'} /></div>
            <h1>{rx.valid ? 'Ordonnance authentique' : 'Ordonnance expirée'}</h1>
            <p className="muted">Cette ordonnance a bien été émise sur MONGANGA par un médecin dont le diplôme et l’inscription à l’Ordre ont été vérifiés.</p>
            <dl className="v3-dl">
              <div><dt>Numéro</dt><dd>{rx.code}</dd></div>
              <div><dt>Émise le</dt><dd>{dateLong(rx.issued_at)}</dd></div>
              <div><dt>Valable jusqu’au</dt><dd>{dateLong(rx.expires_at)}</dd></div>
              <div><dt>État</dt><dd><span className={`state state-${rx.valid ? 'active' : 'cancelled'}`}>{rx.valid ? 'Valide' : 'Expirée'}</span></dd></div>
            </dl>
          </>
        ) : (
          <>
            <div className="v3-icon-circle danger"><Icon name="circle-x" /></div>
            <h1>Ordonnance introuvable</h1>
            <p className="muted">Aucune ordonnance ne correspond à ce code. Elle a peut-être été supprimée (30 jours après la consultation) ou le code est incorrect.</p>
          </>
        )}
        <p className="notice"><Icon name="lock" size={14} /> Par respect du secret médical, aucun nom de patient ni aucun médicament n’est affiché ici.</p>
      </div>
    </section>
  )
}
