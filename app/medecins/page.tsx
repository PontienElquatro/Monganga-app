import { createClient } from '@/lib/supabase/server'

export default async function Medecins() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('doctors_public').select('*')

  return (
    <main style={{ padding: 20 }}>
      <h2>Médecins disponibles ({data?.length ?? 0})</h2>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
      {data?.map((d: any) => (
        <p key={d.id}>{d.full_name} — {d.specialty} — {d.consultation_fee ?? '?'}</p>
      ))}
    </main>
  )
}