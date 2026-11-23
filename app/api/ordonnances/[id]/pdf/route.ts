import { getSession } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildPrescriptionPdf } from '@/lib/services/ordonnance-pdf'
import { verifyUrl } from '@/lib/prescriptions'
import { doctorName, fullName } from '@/lib/format'
import type { Prescription } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** PDF de l'ordonnance, réservé au patient et au médecin concernés (jamais à l'administration). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return new Response('Connexion requise', { status: 401 })
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Introuvable', { status: 404 })

  // Lecture avec la session : la RLS n'autorise que le patient et le médecin.
  const supabase = await createClient()
  const { data: rx } = await supabase.from('prescriptions')
    .select('id, code, appointment_id, doctor_id, patient_id, items, instructions, issued_at, expires_at')
    .eq('id', id).maybeSingle<Prescription>()
  if (!rx || new Date(rx.expires_at).getTime() < Date.now()) return new Response('Introuvable', { status: 404 })

  // Noms des deux parties (l'accès vient d'être vérifié ci-dessus).
  const admin = createAdminClient()
  const [{ data: patient }, { data: doctor }, { data: doctorPro }] = await Promise.all([
    admin.from('profiles').select('first_name, last_name, birth_date').eq('id', rx.patient_id).single<{ first_name: string; last_name: string; birth_date: string | null }>(),
    admin.from('profiles').select('first_name, last_name').eq('id', rx.doctor_id).single<{ first_name: string; last_name: string }>(),
    admin.from('doctor_profiles').select('title, specialty').eq('id', rx.doctor_id).single<{ title: string; specialty: string }>(),
  ])
  const age = patient?.birth_date ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 86_400_000)) : null

  const pdf = await buildPrescriptionPdf({
    code: rx.code,
    verifyUrl: verifyUrl(rx.code),
    patientName: patient ? fullName(patient) : 'Patient',
    patientAge: age,
    doctorName: doctor ? doctorName({ title: doctorPro?.title, ...doctor }) : 'Médecin',
    doctorSpecialty: doctorPro?.specialty ?? '',
    issuedAt: rx.issued_at,
    expiresAt: rx.expires_at,
    items: rx.items,
    instructions: rx.instructions,
  })
  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ordonnance-${rx.code}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
