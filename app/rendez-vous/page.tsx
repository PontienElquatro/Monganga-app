import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/get-user'
import { payerReservation, refuserRendezVous, annulerRendezVous } from './actions'

export default async function RendezVousPage() {
  const user = await getCurrentUser()
  if (!user) {
    return <div style={{ padding: 24 }}>Connectez-vous pour voir vos rendez-vous.</div>
  }

  const supabase = await createClient()

  const { data: rdvs } = await supabase
    .from('appointments')
    .select('id, status, reservation_fee, reservation_paid, created_at, availabilities ( start_time, end_time )')
    .order('created_at', { ascending: false })

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>Mes rendez-vous (test) — {user.role}</h1>
      <ul>
        {rdvs?.map((rdv: any) => (
          <li key={rdv.id} style={{ marginBottom: 16, borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
            <div>Statut : <strong>{rdv.status}</strong></div>
            <div>
              Créneau : {rdv.availabilities
                ? new Date(rdv.availabilities.start_time).toLocaleString('fr-FR')
                : '—'}
            </div>
            <div>Frais de réservation : {rdv.reservation_fee} $ — {rdv.reservation_paid ? 'payé' : 'non payé'}</div>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {user.role === 'patient' && rdv.status === 'en_attente' && !rdv.reservation_paid && (
                <form action={payerReservation.bind(null, rdv.id)}>
                  <button type="submit">Payer 1 $ (mock)</button>
                </form>
              )}
              {user.role === 'medecin' && ['en_attente', 'confirme'].includes(rdv.status) && (
                <form action={refuserRendezVous.bind(null, rdv.id)}>
                  <button type="submit">Refuser</button>
                </form>
              )}
              {['en_attente', 'confirme'].includes(rdv.status) && (
                <form action={annulerRendezVous.bind(null, rdv.id)}>
                  <button type="submit">Annuler</button>
                </form>
              )}
            </div>
          </li>
        ))}
        {rdvs?.length === 0 && <li>Aucun rendez-vous pour linstant.</li>}
      </ul>
    </div>
  )
}
