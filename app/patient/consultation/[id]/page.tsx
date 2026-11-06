import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ConsultationRoom } from '@/components/consultation/room'
import { requireRole } from '@/lib/auth'
import { loadConsultation } from '@/lib/consultation'
import { getSettings } from '@/lib/settings'
import { fullName } from '@/lib/format'

export const metadata: Metadata = { title: 'Consultation' }

export default async function PatientConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole('patient')
  const data = await loadConsultation(id)
  if (!data || data.ctx.viewer !== 'patient') notFound()
  const { ctx } = data

  // « Démarrer » sans solde payé : on passe d'abord par le paiement, s'il est ouvert.
  if (!ctx.balance_paid && (ctx.status === 'confirme' || ctx.status === 'en_cours')) {
    const s = await getSettings()
    const start = new Date(ctx.starts_at).getTime()
    const now = Date.now()
    if (now >= start - s.ouverture_solde_minutes * 60_000 && now <= start + s.absence_minutes * 60_000) {
      redirect(`/patient/paiement/${id}?etape=solde`)
    }
  }

  return (
    <ConsultationRoom ctx={ctx} me={session.userId} meName={fullName(session.profile)} meAvatar={session.profile.avatar_url}
                      initialMessages={data.messages} initialFiles={data.files} leaveHref="/patient/rendez-vous" />
  )
}
