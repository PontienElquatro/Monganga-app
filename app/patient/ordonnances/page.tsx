import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeading } from '@/components/ui/page-heading'
import { PrescriptionTicket } from '@/components/prescriptions/ticket'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getPatientAppointments } from '@/lib/patient'
import { qrDataUrl } from '@/lib/prescriptions'
import { fullName } from '@/lib/format'
import type { Prescription } from '@/lib/types'

export const metadata: Metadata = { title: 'Mes ordonnances' }

export default async function OrdonnancesPage() {
  const session = await requireRole('patient')
  const supabase = await createClient()
  const [{ data }, appointments] = await Promise.all([
    supabase.from('prescriptions').select('id, code, appointment_id, doctor_id, patient_id, items, instructions, issued_at, expires_at')
      .gt('expires_at', new Date().toISOString()).order('issued_at', { ascending: false }),
    getPatientAppointments(),
  ])
  const list = (data ?? []) as Prescription[]
  const byAppt = new Map(appointments.map((a) => [a.id, a]))
  const qrs = await Promise.all(list.map((rx) => qrDataUrl(rx.code)))
  const days = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))

  return (
    <>
      <PageHeading title="Mes ordonnances" description="Les ordonnances émises par vos médecins, à montrer en pharmacie." />
      <p className="notice warning v3-retention"><Icon name="clock" /> Pour protéger vos données, chaque ordonnance et ses documents sont supprimés 30 jours après la consultation. Téléchargez-les si vous voulez les garder.</p>
      {list.length ? (
        <div className="stack-lg">
          {list.map((rx, i) => {
            const a = byAppt.get(rx.appointment_id)
            return (
              <div className="layout-two" key={rx.id}>
                <PrescriptionTicket rx={rx} patientName={fullName(session.profile)} doctorName={a?.doctor_name ?? 'Médecin'}
                                    doctorSpecialty={a?.doctor_specialty ?? ''} qrDataUrl={qrs[i]} />
                <aside className="panel stack">
                  <h2>Actions</h2>
                  <a className="btn btn-primary btn-block" href={`/api/ordonnances/${rx.id}/pdf`}><Icon name="download" /> Télécharger en PDF</a>
                  <Link className="btn btn-secondary btn-block" href={`/verifier/${rx.code}`}><Icon name="qr-code" /> Page de vérification</Link>
                  <p className="meta">Encore disponible {days(rx.expires_at)} jour{days(rx.expires_at) > 1 ? 's' : ''}. Le pharmacien peut aussi saisir le numéro {rx.code} sur la page de vérification.</p>
                </aside>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState icon="file-text" title="Aucune ordonnance pour l’instant" text="Après une consultation, l’ordonnance de votre médecin apparaît ici, avec un QR code de vérification." />
      )}
    </>
  )
}
