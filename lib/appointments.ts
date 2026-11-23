// Règles d'affichage d'un rendez-vous côté patient (pures : utilisables partout).
import type { IconName } from '@/components/ui/icon'
import type { PatientAppointment } from '@/lib/types'
import { time, usd } from '@/lib/format'

export interface Timing {
  ouvertureSoldeMinutes: number
  absenceMinutes: number
  fermetureSalleMinutes: number
  annulationGratuiteHeures: number
}

export interface NextStep {
  label: string
  href: string | null
  icon: IconName
  hint: string | null
  badge: { label: string; tone: string } | null
}

const MIN = 60_000

export const isUpcoming = (a: PatientAppointment, now = Date.now()) =>
  (a.status === 'en_attente_acompte' && new Date(a.deposit_due_at).getTime() > now) ||
  a.status === 'confirme' || a.status === 'en_cours'

/** Ce que le patient doit faire maintenant pour ce rendez-vous. */
export function patientStep(a: PatientAppointment, t: Timing, now = Date.now()): NextStep {
  const start = new Date(a.starts_at).getTime()
  const balance = a.fee_cents - a.deposit_cents
  const closes = new Date(a.ends_at).getTime() + t.fermetureSalleMinutes * MIN

  if (a.status === 'en_attente_acompte') {
    return {
      label: `Payer l’acompte · ${usd(a.deposit_cents)}`, href: `/patient/paiement/${a.id}`, icon: 'credit-card',
      hint: `Créneau retenu jusqu’à ${time(a.deposit_due_at)}. Sans paiement, il est libéré.`,
      badge: { label: 'Acompte à payer', tone: 'pending' },
    }
  }
  if ((a.status === 'confirme' || a.status === 'en_cours') && !a.balance_paid_at) {
    const opens = start - t.ouvertureSoldeMinutes * MIN
    const tooLate = start + t.absenceMinutes * MIN
    if (now < opens) {
      return {
        label: `Solde · ${usd(balance)}`, href: null, icon: 'clock',
        hint: `Le paiement du solde ouvre à ${time(new Date(opens).toISOString())}, une heure avant la consultation.`,
        badge: { label: 'Confirmé', tone: 'confirmed' },
      }
    }
    if (now <= tooLate) {
      return {
        label: `Payer le solde · ${usd(balance)}`, href: `/patient/paiement/${a.id}?etape=solde`, icon: 'credit-card',
        hint: 'Une fois le solde payé, le bouton « Démarrer » apparaît.',
        badge: { label: 'Solde à payer', tone: 'pending' },
      }
    }
    return { label: 'Délai dépassé', href: null, icon: 'circle-alert', hint: 'Le délai pour payer le solde est dépassé.', badge: { label: 'Solde non payé', tone: 'cancelled' } }
  }
  if (a.status === 'confirme' || a.status === 'en_cours') {
    if (now < start - 5 * MIN) {
      return {
        label: 'Salle d’attente', href: `/patient/consultation/${a.id}`, icon: 'video',
        hint: `Tout est payé. La salle ouvre à ${time(new Date(start - 5 * MIN).toISOString())}.`,
        badge: { label: 'Prêt', tone: 'confirmed' },
      }
    }
    if (now <= closes) {
      return { label: 'Démarrer la consultation', href: `/patient/consultation/${a.id}`, icon: 'video', hint: null, badge: { label: a.status === 'en_cours' ? 'En cours' : 'Prêt', tone: 'active' } }
    }
  }
  return { label: '', href: null, icon: 'info', hint: null, badge: null }
}

/** Conséquence d'une annulation par le patient, annoncée avant de confirmer. */
export function cancelConsequence(a: PatientAppointment, t: Timing, now = Date.now()): string {
  if (a.status === 'en_attente_acompte') return 'Aucun paiement n’a été fait : l’annulation est sans frais.'
  const hours = (new Date(a.starts_at).getTime() - now) / 3_600_000
  if (hours >= t.annulationGratuiteHeures) return `Plus de ${t.annulationGratuiteHeures} h avant : l’acompte de ${usd(a.deposit_cents)} vous sera remboursé.`
  return `Moins de ${t.annulationGratuiteHeures} h avant : l’acompte de ${usd(a.deposit_cents)} reste acquis.`
}

export const canCancel = (a: PatientAppointment, now = Date.now()) =>
  (a.status === 'en_attente_acompte' || a.status === 'confirme') && new Date(a.starts_at).getTime() > now

export function refundLine(a: PatientAppointment): string | null {
  if (!a.refund_status) return null
  return a.refund_status === 'effectue' ? 'Remboursement effectué sur votre moyen de paiement.' : 'Remboursement en cours de traitement par l’équipe MONGANGA.'
}
