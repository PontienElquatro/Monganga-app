import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/supabase/require-role'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { creerDisponibilite, supprimerDisponibilite } from './actions'

export default async function DisponibilitesPage() {
  await requireRole(['medecin'])
  const user = await getCurrentUser()
  const supabase = await createClient()

  const { data: creneaux } = await supabase
    .from('availabilities')
    .select('*')
    .eq('doctor_id', user!.id)
    .order('start_time', { ascending: true })

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1>Mes disponibilités (test)</h1>

      <form action={creerDisponibilite} style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
        <label>Date <input type="date" name="date" required /></label>
        <label>Heure début <input type="time" name="heure_debut" required /></label>
        <label>Heure fin <input type="time" name="heure_fin" required /></label>
        <button type="submit">Ajouter le créneau</button>
      </form>

      <ul>
        {creneaux?.map((c) => (
          <li key={c.id} style={{ marginBottom: 8 }}>
            {new Date(c.start_time).toLocaleString('fr-FR')} → {new Date(c.end_time).toLocaleTimeString('fr-FR')}
            {' '}— {c.is_booked ? '🔴 réservé' : '🟢 libre'}
            {!c.is_booked && (
              <form action={supprimerDisponibilite.bind(null, c.id)} style={{ display: 'inline', marginLeft: 8 }}>
                <button type="submit">Supprimer</button>
              </form>
            )}
          </li>
        ))}
        {creneaux?.length === 0 && <li>Aucun créneau pour l'instant.</li>}
      </ul>
    </div>
  )
}
