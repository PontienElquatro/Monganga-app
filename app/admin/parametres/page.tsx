import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { ActionForm } from '@/components/ui/action-form'
import { SubmitButton } from '@/components/ui/form'
import { PageHeading } from '@/components/ui/page-heading'
import { createClient } from '@/lib/supabase/server'
import { dateShort } from '@/lib/format'
import { updateSettingAction } from '@/app/admin/actions'

export const metadata: Metadata = { title: 'Paramètres' }

const UNITS: Record<string, { unit: 'usd' | 'min' | 'h' | 'j' | '%'; label: string; locked?: boolean }> = {
  acompte_centimes: { unit: 'usd', label: 'Acompte de réservation' },
  commission_defaut: { unit: '%', label: 'Commission par défaut' },
  duree_consultation_minutes: { unit: 'min', label: 'Durée d’une consultation', locked: true },
  delai_min_reservation_minutes: { unit: 'min', label: 'Délai minimum avant un rendez-vous' },
  delai_paiement_acompte_minutes: { unit: 'min', label: 'Temps pour payer l’acompte' },
  ouverture_solde_minutes: { unit: 'min', label: 'Ouverture du paiement du solde' },
  annulation_gratuite_heures: { unit: 'h', label: 'Annulation avec remboursement de l’acompte' },
  absence_minutes: { unit: 'min', label: 'Délai avant « patient absent »' },
  fermeture_salle_minutes: { unit: 'min', label: 'Fermeture de la salle après la fin' },
  conservation_jours: { unit: 'j', label: 'Conservation des ordonnances et documents' },
  tarif_min_centimes: { unit: 'usd', label: 'Tarif minimum d’un médecin' },
  tarif_max_centimes: { unit: 'usd', label: 'Tarif maximum d’un médecin' },
}
const SUFFIX = { usd: '$', min: 'minutes', h: 'heures', j: 'jours', '%': '%' }

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('key, value, description, updated_at').order('key')
  const rows = ((data ?? []) as { key: string; value: number; description: string; updated_at: string }[]).filter((r) => r.key in UNITS)
  return (
    <>
      <PageHeading space="Administration" title="Paramètres" description="Règles de la plateforme. Chaque modification est enregistrée dans le journal." />
      <p className="notice warning"><Icon name="circle-alert" /> Ces valeurs s’appliquent immédiatement aux nouvelles réservations. Les rendez-vous déjà réservés gardent leurs montants.</p>
      <div className="settings-grid">
        {Object.keys(UNITS).map((key) => {
          const r = rows.find((x) => x.key === key)
          if (!r) return null
          const u = UNITS[key]
          const shown = u.unit === 'usd' ? (Number(r.value) / 100).toString().replace('.', ',') : String(r.value)
          return (
            <section className="panel stack" key={key}>
              <h2>{u.label}</h2>
              <p className="meta">{r.description}</p>
              {u.locked ? (
                <p><strong>{shown} {SUFFIX[u.unit]}</strong> <span className="meta">— fixé pour tous les médecins.</span></p>
              ) : (
                <ActionForm action={updateSettingAction} className="inline-form">
                  <input type="hidden" name="key" value={key} />
                  <input type="hidden" name="unit" value={u.unit} />
                  <input className="form-input" name="value" defaultValue={shown} inputMode="decimal" required aria-label={u.label} style={{ width: 110 }} />
                  <span>{SUFFIX[u.unit]}</span>
                  <SubmitButton className="btn btn-secondary btn-sm" icon="check">Enregistrer</SubmitButton>
                </ActionForm>
              )}
              <span className="meta">Modifié le {dateShort(r.updated_at)}</span>
            </section>
          )
        })}
      </div>
    </>
  )
}
