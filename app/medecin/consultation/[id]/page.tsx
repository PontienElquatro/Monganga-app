import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ConsultationRoom } from '@/components/consultation/room'
import { ConsultPanel } from '@/components/doctor/consult-panel'
import { requireRole } from '@/lib/auth'
import { loadConsultation } from '@/lib/consultation'
import { createClient } from '@/lib/supabase/server'
import { doctorName } from '@/lib/format'
import type { PrescriptionItem } from '@/lib/types'

export const metadata: Metadata = { title: 'Consultation' }

export default async function MedecinConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole('medecin')
  const data = await loadConsultation(id)
  if (!data || data.ctx.viewer !== 'medecin') notFound()
  const supabase = await createClient()
  const [{ data: note }, { data: rx }, { data: appt }] = await Promise.all([
    supabase.from('doctor_notes').select('content').eq('appointment_id', id).maybeSingle<{ content: string }>(),
    supabase.from('prescriptions').select('code, items, instructions').eq('appointment_id', id).maybeSingle<{ code: string; items: PrescriptionItem[]; instructions: string | null }>(),
    supabase.from('appointments').select('ended_at').eq('id', id).maybeSingle<{ ended_at: string | null }>(),
  ])
  const { ctx } = data
  const canPrescribe = ctx.status === 'en_cours' ||
    (ctx.status === 'terminee' && !!appt?.ended_at && Date.now() - new Date(appt.ended_at).getTime() < 24 * 3_600_000)

  return (
    <ConsultationRoom
      ctx={ctx}
      me={session.userId}
      meName={doctorName({ title: session.doctor?.title, ...session.profile })}
      meAvatar={session.profile.avatar_url}
      initialMessages={data.messages}
      initialFiles={data.files}
      leaveHref="/medecin/agenda"
      aside={<ConsultPanel appointmentId={id} status={ctx.status} closesAt={ctx.closes_at} initialNote={note?.content ?? ''}
                           prescription={rx ?? null} canPrescribe={canPrescribe} />}
    />
  )
}
