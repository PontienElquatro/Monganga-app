import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { postuler } from './actions'

export default async function Candidature() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dossier } = await supabase
    .from('doctor_profiles')
    .select('status, rejection_reason')
    .eq('id', user.id)
    .maybeSingle()

  if (dossier) {
    const messages: Record<string, string> = {
      en_attente: 'Votre dossier est en cours de validation.',
      valide: 'Votre compte médecin est validé.',
      rejete: `Dossier rejeté. ${dossier.rejection_reason ?? ''}`,
      suspendu: 'Votre compte est suspendu.',
    }
    return <main style={{ padding: 20 }}>{messages[dossier.status]}</main>
  }

  return (
    <main style={{ padding: 20, maxWidth: 360 }}>
      <form action={postuler} style={{ display: 'grid', gap: 8 }}>
        <h2>Devenir médecin</h2>
        <input name="specialty" placeholder="Spécialité" required />
        <textarea name="bio" placeholder="Présentation" />
        <input name="consultation_fee" type="number" placeholder="Honoraires" />
        <button>Envoyer ma candidature</button>
      </form>
    </main>
  )
}