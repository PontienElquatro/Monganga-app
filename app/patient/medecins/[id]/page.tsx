import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DoctorProfile } from '@/components/doctors/doctor-profile'
import { SlotPicker } from '@/components/doctors/slot-picker'
import { Icon } from '@/components/ui/icon'
import { getBookableSlots, getPublicDoctor } from '@/lib/doctors'
import { getSettings } from '@/lib/settings'
import { bookAppointmentAction } from '@/app/patient/actions'

export default async function PatientMedecinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doctor = await getPublicDoctor(id)
  if (!doctor) notFound()
  const [slots, settings] = await Promise.all([getBookableSlots(id), getSettings()])
  return (
    <>
      <div className="breadcrumb mb-4"><Link href="/patient/recherche">Médecins</Link><Icon name="chevron-right" /><span>{doctor.first_name} {doctor.last_name}</span></div>
      <div className="layout-two">
        <DoctorProfile doctor={doctor} depositCents={settings.acompte_centimes} />
        <SlotPicker slots={slots} depositCents={settings.acompte_centimes} action={bookAppointmentAction} />
      </div>
    </>
  )
}
