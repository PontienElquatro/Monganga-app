'use server'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/supabase/require-role'
import { createAdminClient } from '@/lib/supabase/admin'

export async function valider(formData: FormData) {
  const me = await requireRole(['admin'])
  const id = String(formData.get('id'))
  const db = createAdminClient()

  const { error: e1 } = await db.from('doctor_profiles').update({
    status: 'valide',
    validated_at: new Date().toISOString(),
    validated_by: me.id,
    rejection_reason: null,
  }).eq('id', id)
  if (e1) throw new Error(e1.message)

  const { error: e2 } = await db.from('profiles').update({ role: 'medecin' }).eq('id', id)
  if (e2) throw new Error(e2.message)

  revalidatePath('/admin/medecins')
}

export async function rejeter(formData: FormData) {
  await requireRole(['admin'])
  const db = createAdminClient()
  const { error } = await db.from('doctor_profiles').update({
    status: 'rejete',
    rejection_reason: String(formData.get('reason') ?? '') || null,
  }).eq('id', String(formData.get('id')))
  if (error) throw new Error(error.message)

  revalidatePath('/admin/medecins')
}