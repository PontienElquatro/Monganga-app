import Link from 'next/link'
import type { Metadata } from 'next'
import { Icon, type IconName } from '@/components/ui/icon'
import { PageHeading } from '@/components/ui/page-heading'
import { hasAdminRole, requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { adminRolesLabel } from '@/lib/admin-roles'
import { kinDayStart, kinMonthStart, todayKinshasa, usd } from '@/lib/format'

export const metadata: Metadata = { title: 'Administration' }

type Activity = Record<'rdv_aujourdhui' | 'rdv_a_examiner' | 'annulations_medecin_7j' | 'patients' | 'nouveaux_patients_7j'
  | 'comptes_suspendus' | 'dossiers_en_attente' | 'complements_demandes' | 'medecins_valides', number>

function Kpi({ icon, label, value, note }: { icon: IconName; label: string; value: string | number; note?: string }) {
  return (
    <div className="kpi-card"><div className="kpi-label"><Icon name={icon} /> {label}</div><div className="kpi-value">{value}</div>
      {note ? <span className="kpi-trend up">{note}</span> : null}</div>
  )
}

/** Vue d'ensemble : chaque membre de l'équipe voit les chiffres de ses rôles (le super administrateur voit tout). */
export default async function AdminHome() {
  const session = await requireAdmin()
  const finance = hasAdminRole(session, 'finance')
  const support = hasAdminRole(session, 'support')
  const validation = hasAdminRole(session, 'validation')
  const supabase = await createClient()
  const today = kinDayStart(todayKinshasa())
  const month = kinDayStart(kinMonthStart())

  const { data: act } = await supabase.rpc('admin_activity')
  const a = (act ?? {}) as Partial<Activity>
  const n = (k: keyof Activity) => Number(a[k] ?? 0)

  const sum = (rows: { amount_cents: number }[] | null | undefined) => (rows ?? []).reduce((s, r) => s + r.amount_cents, 0)
  let money: { todayIn: number; monthIn: number; platform: number; refunds: { amount_cents: number }[]; payouts: { amount_cents: number }[] } | null = null
  if (finance) {
    const [paidToday, paidMonth, platform, refunds, payouts] = await Promise.all([
      supabase.from('payments').select('amount_cents').eq('status', 'reussi').gte('paid_at', today),
      supabase.from('payments').select('amount_cents').eq('status', 'reussi').gte('paid_at', month),
      supabase.from('ledger_entries').select('amount_cents').eq('type', 'part_plateforme').gte('created_at', month),
      supabase.from('refunds').select('amount_cents').eq('status', 'a_traiter'),
      supabase.from('payouts').select('amount_cents').eq('status', 'a_verser'),
    ])
    money = {
      todayIn: sum(paidToday.data as { amount_cents: number }[]),
      monthIn: sum(paidMonth.data as { amount_cents: number }[]),
      platform: sum(platform.data as { amount_cents: number }[]),
      refunds: (refunds.data ?? []) as { amount_cents: number }[],
      payouts: (payouts.data ?? []) as { amount_cents: number }[],
    }
  }

  const alerts: { n: number; icon: IconName; text: string; href: string }[] = []
  if (validation) alerts.push({ n: n('dossiers_en_attente'), icon: 'badge-check', text: 'dossier(s) médecin à examiner', href: '/admin/validations' })
  if (finance && money) {
    alerts.push(
      { n: n('rdv_a_examiner'), icon: 'circle-alert', text: 'rendez-vous à trancher (présence incertaine)', href: '/admin/transactions#a-examiner' },
      { n: money.refunds.length, icon: 'banknote', text: `remboursement(s) à effectuer (${usd(sum(money.refunds))})`, href: '/admin/transactions#remboursements' },
      { n: money.payouts.length, icon: 'hand-coins', text: `versement(s) préparé(s) à envoyer (${usd(sum(money.payouts))})`, href: '/admin/versements' },
    )
  }
  if (support) alerts.push({ n: n('annulations_medecin_7j'), icon: 'user-x', text: 'annulation(s) ou absence(s) de médecin ces 7 derniers jours', href: '/admin/utilisateurs?role=medecin' })
  const todo = alerts.filter((x) => x.n > 0)

  return (
    <>
      <PageHeading space="Administration" title="Vue d’ensemble" description={`Ce qui demande votre attention aujourd’hui · ${adminRolesLabel(session.profile.admin_roles)}`} />

      {finance && money ? (
        <section className="mb-4">
          <h2 className="mb-4">Argent</h2>
          <div className="kpi-grid" style={{ marginBottom: 28 }}>
            <Kpi icon="wallet" label="Encaissé aujourd’hui" value={usd(money.todayIn)} />
            <Kpi icon="receipt" label="Encaissé ce mois" value={usd(money.monthIn)} />
            <Kpi icon="trending-up" label="Part plateforme ce mois" value={usd(money.platform)} />
            <Kpi icon="banknote" label="Remboursements à faire" value={money.refunds.length} note={usd(sum(money.refunds))} />
          </div>
        </section>
      ) : null}

      {support ? (
        <section className="mb-4">
          <h2 className="mb-4">Utilisateurs et activité</h2>
          <div className="kpi-grid" style={{ marginBottom: 28 }}>
            <Kpi icon="video" label="Consultations aujourd’hui" value={n('rdv_aujourdhui')} />
            <Kpi icon="users" label="Patients inscrits" value={n('patients')} note={`+${n('nouveaux_patients_7j')} en 7 jours`} />
            <Kpi icon="ban" label="Comptes suspendus" value={n('comptes_suspendus')} />
            <Kpi icon="user-x" label="Annulations médecin (7 j)" value={n('annulations_medecin_7j')} />
          </div>
        </section>
      ) : null}

      {validation ? (
        <section className="mb-4">
          <h2 className="mb-4">Médecins</h2>
          <div className="kpi-grid" style={{ marginBottom: 28 }}>
            <Kpi icon="badge-check" label="Dossiers en attente" value={n('dossiers_en_attente')} />
            <Kpi icon="file-up" label="Compléments demandés" value={n('complements_demandes')} />
            <Kpi icon="stethoscope" label="Médecins validés" value={n('medecins_valides')} />
          </div>
        </section>
      ) : null}

      <section className="panel stack">
        <h2>À traiter</h2>
        {todo.length ? (
          <ul className="notif-list">
            {todo.map((x) => (
              <li key={x.href} className="notif-item unread">
                <span className="notif-icon"><Icon name={x.icon} /></span>
                <div><strong>{x.n}</strong> {x.text}</div>
                <Link className="btn btn-ghost btn-sm" href={x.href}>Ouvrir <Icon name="chevron-right" /></Link>
              </li>
            ))}
          </ul>
        ) : <p className="notice success"><Icon name="circle-check" /> Rien en attente. Tout est à jour.</p>}
      </section>
    </>
  )
}
