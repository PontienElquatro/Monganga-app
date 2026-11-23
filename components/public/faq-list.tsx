'use client'
import { useState } from 'react'
import { Icon, type IconName } from '@/components/ui/icon'

export interface FaqEntry { category: string; icon: IconName; question: string; answer: string }

const CATEGORIES: [string, string][] = [
  ['tout', 'Toutes'], ['rdv', 'Rendez-vous'], ['paiement', 'Paiement'], ['consultation', 'Consultation'], ['medecin', 'Devenir médecin'],
]

export function FaqList({ entries }: { entries: FaqEntry[] }) {
  const [filter, setFilter] = useState('tout')
  const [open, setOpen] = useState<number | null>(0)
  return (
    <>
      <section className="container" style={{ paddingBottom: 32 }}>
        <div className="faq-categories">
          {CATEGORIES.map(([key, label]) => (
            <button key={key} type="button" className={`chip${filter === key ? ' active' : ''}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
      </section>
      <section className="container" style={{ paddingBottom: 72 }}>
        <div className="faq-list">
          {entries.map((e, i) => (filter === 'tout' || filter === e.category) && (
            <div key={e.question} className={`faq-item${open === i ? ' open' : ''}`}>
              <button type="button" className="faq-question" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? null : i)}>
                <div className="faq-icon"><Icon name={e.icon} /></div>
                <span>{e.question}</span>
                <Icon name="chevron-down" className="faq-chevron" />
              </button>
              <div className="faq-answer" id={`faq-${i}`}><p>{e.answer}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
