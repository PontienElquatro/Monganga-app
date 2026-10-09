import { requireRole } from '@/lib/supabase/require-role'
import { createClient } from '@/lib/supabase/server'
import { valider, rejeter } from './actions'

export default async function AdminMedecins() {
  await requireRole(['admin'])
  const supabase = await createClient()
  const { data: attente, error } = await supabase
    .from('doctor_profiles')
    .select('id, specialty, bio, consultation_fee, profiles!doctor_profiles_id_fkey(full_name)')
    .eq('status', 'en_attente')

  return (
    <main style={{ padding: 20, display: 'grid', gap: 16 }}>
      <h2>Médecins en attente ({attente?.length ?? 0})</h2>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
      {attente?.map((d: any) => (
        <div key={d.id} style={{ border: '1px solid #888', padding: 12 }}>
          <b>{d.profiles?.full_name || d.id}</b> — {d.specialty}
          <p>{d.bio}</p>
          <form action={valider}>
            <input type="hidden" name="id" value={d.id} />
            <button>Valider</button>
          </form>
          <form action={rejeter}>
            <input type="hidden" name="id" value={d.id} />
            <input name="reason" placeholder="Motif du rejet" />
            <button>Rejeter</button>
          </form>
        </div>
      ))}
    </main>
  )
}