import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { DoctorProfile } from '@/components/doctors/doctor-profile'
import { SlotPicker } from '@/components/doctors/slot-picker'
import { Icon } from '@/components/ui/icon'
import { getBookableSlots, getPublicDoctor } from '@/lib/doctors'
import { getSession } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

export default async function MedecinPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (session?.profile.role === 'patient') redirect(`/patient/medecins/${id}`)
  const doctor = await getPublicDoctor(id)
  if (!doctor) notFound()
  const [slots, settings] = await Promise.all([getBookableSlots(id), getSettings()])
  return (
    <section className="container section">
      <div className="breadcrumb mb-4"><Link href="/medecins">Médecins</Link><Icon name="chevron-right" /><span>{doctor.first_name} {doctor.last_name}</span></div>
      <div className="layout-two">
        <DoctorProfile doctor={doctor} depositCents={settings.acompte_centimes} />
        <SlotPicker slots={slots} depositCents={settings.acompte_centimes} loginHref={`/connexion?suite=/patient/medecins/${id}`} />
      </div>
    </section>
  )
}
