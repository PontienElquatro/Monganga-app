'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function postuler(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const specialty = String(formData.get('specialty') ?? '').trim()
  if (!specialty) redirect('/medecin/candidature')

  const fee = Number(formData.get('consultation_fee'))
  await supabase.from('doctor_profiles').insert({
    id: user.id,
    specialty,
    bio: String(formData.get('bio') ?? '').trim() || null,
    consultation_fee: Number.isFinite(fee) && fee > 0 ? fee : null,
  })
  redirect('/medecin/candidature')
}