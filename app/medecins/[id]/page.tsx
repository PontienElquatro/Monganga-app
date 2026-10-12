import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { reserverCreneau } from './actions'

export default async function FicheMedecinPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ erreur?: string }>
}) {
  const { id } = await params
  const { erreur } = await searchParams
  const supabase = await createClient()
  const user = await getCurrentUser()

  const { data: medecin } = await supabase
    .from('doctors_public')
    .select('*')
    .eq('id', id)
    .single()

  if (!medecin) {
    return <div style={{ padding: 24 }}>Médecin introuvable ou non validé.</div>
  }

  const { data: creneaux } = await supabase
    .from('availabilities')
    .select('id, start_time, end_time')
    .eq('doctor_id', id)
    .eq('is_booked', false)
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1>{medecin.full_name}</h1>
      <p>{medecin.specialty}</p>
      <p>{medecin.bio}</p>
      <p>Honoraire consultation : {medecin.consultation_fee} $</p>

      {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

      <h2>Créneaux disponibles</h2>
      {!user && <p>Connectez-vous en tant que patient pour réserver.</p>}
      <ul>
        {creneaux?.map((c) => (
          <li key={c.id} style={{ marginBottom: 8 }}>
            {new Date(c.start_time).toLocaleString('fr-FR')}
            {user?.role === 'patient' && (
              <form action={reserverCreneau.bind(null, id, c.id)} style={{ display: 'inline', marginLeft: 8 }}>
                <button type="submit">Réserver (1 $ de frais)</button>
              </form>
            )}
          </li>
        ))}
        {creneaux?.length === 0 && <li>Aucun créneau disponible pour linstant.</li>}
      </ul>
    </div>
  )
}