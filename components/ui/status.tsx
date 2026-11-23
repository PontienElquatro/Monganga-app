import { APPOINTMENT_STATUS, DOCTOR_STATUS } from '@/lib/format'
import type { AppointmentStatus, DoctorStatus } from '@/lib/types'

export function AppointmentBadge({ status, override }: { status: AppointmentStatus; override?: { label: string; tone: string } }) {
  const s = override ?? APPOINTMENT_STATUS[status]
  return <span className={`state state-${s.tone}`}>{s.label}</span>
}

export function DoctorBadge({ status }: { status: DoctorStatus }) {
  const s = DOCTOR_STATUS[status]
  return <span className={`state state-${s.tone}`}>{s.label}</span>
}

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`state state-${tone}`}>{children}</span>
}
