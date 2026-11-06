import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon } from '@/components/ui/icon'
import { PageHeading } from '@/components/ui/page-heading'
import { createClient } from '@/lib/supabase/server'
import { kinDayStart, kinMonthStart, todayKinshasa, usd } from '@/lib/format'

export const metadata: Metadata = { title: 'Administration' }

export default async function AdminHome() {
  const supabase = await createClient()
  const today = todayKinshasa()
  const head = { count: 'exact' as const, head: true }
  const [pending, complement, examine, refunds, platform, todayAppts, patients, doctors, payouts] = await Promise.all([
    supabase.from('doctor_profiles').select('id', head).eq('status', 'en_attente'),
    supabase.from('doctor_profiles').select('id', head).eq('status', 'complement_demande'),
    supabase.from('appointments').select('id', head).eq('status', 'a_examiner'),
    supabase.from('refunds').select('amount_cents').eq('status', 'a_traiter'),
    supabase.from('ledger_entries').select('amount_cents').eq('type', 'part_plateforme').gte('created_at', kinDayStart(kinMonthStart())),
    supabase.from('appointments').select('id', head).in('status', ['confirme', 'en_cours', 'terminee']).gte('starts_at', kinDayStart(today)).lt('starts_at', kinDayStart(todayKinshasa(1))),
    supabase.from('profiles').select('id', head).eq('role', 'patient'),
    supabase.from('doctor_profiles').select('id', head).eq('status', 'valide'),
    supabase.from('payouts').select('amount_cents').eq('status', 'a_verser'),
  ])
  const sum = (rows: { amount_cents: number }[] | null) => (rows ?? []).reduce((s, r) => s + r.amount_cents, 0)
  const refundRows = (refunds.data ?? []) as { amount_cents: number }[]
  const payoutRows = (payouts.data ?? []) as { amount_cents: number }[]

  const alerts = [
    { n: pending.count ?? 0, icon: 'badge-check' as const, text: 'dossier(s) médecin à examiner', href: '/admin/validations' },
    { n: examine.count ?? 0, icon: 'circle-alert' as const, text: 'rendez-vous à trancher (présence incertaine)', href: '/admin/transactions#a-examiner' },
    { n: refundRows.length, icon: 'banknote' as const, text: `remboursement(s) à effectuer (${usd(sum(refundRows))})`, href: '/admin/transactions#remboursements' },
    { n: payoutRows.length, icon: 'hand-coins' as const, text: `versement(s) préparé(s) à envoyer (${usd(sum(payoutRows))})`, href: '/admin/versements' },
  ].filter((a) => a.n > 0)

  return (
    <>
      <PageHeading space="Administration" title="Vue d’ensemble" description="Ce qui demande votre attention aujourd’hui." />
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        <div className="kpi-card"><div className="kpi-label"><Icon name="video" /> Consultations aujourd’hui</div><div className="kpi-value">{todayAppts.count ?? 0}</div></div>
        <div className="kpi-card"><div className="kpi-label"><Icon name="trending-up" /> Part plateforme ce mois</div><div className="kpi-value">{usd(sum((platform.data ?? []) as { amount_cents: number }[]))}</div></div>
        <div className="kpi-card"><div className="kpi-label"><Icon name="stethoscope" /> Médecins validés</div><div className="kpi-value">{doctors.count ?? 0}</div><span className="kpi-trend up">{(pending.count ?? 0) + (complement.count ?? 0)} dossier(s) en cours</span></div>
        <div className="kpi-card"><div className="kpi-label"><Icon name="users" /> Patients inscrits</div><div className="kpi-value">{patients.count ?? 0}</div></div>
      </div>
      <section className="panel stack">
        <h2>À traiter</h2>
        {alerts.length ? (
          <ul className="notif-list">
            {alerts.map((a) => (
              <li key={a.href} className="notif-item unread">
                <span className="notif-icon"><Icon name={a.icon} /></span>
                <div><strong>{a.n}</strong> {a.text}</div>
                <Link className="btn btn-ghost btn-sm" href={a.href}>Ouvrir <Icon name="chevron-right" /></Link>
              </li>
            ))}
          </ul>
        ) : <p className="notice success"><Icon name="circle-check" /> Rien en attente. Tout est à jour.</p>}
      </section>
    </>
  )
}
