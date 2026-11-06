import { Icon } from '@/components/ui/icon'
import type { DoctorFilters as Filters } from '@/lib/doctors'

/** Filtres de l'annuaire (formulaire GET : fonctionne sans JavaScript). */
export function DoctorFilters({ action, values, specialties, communes }: { action: string; values: Filters; specialties: string[]; communes: string[] }) {
  return (
    <form className="search-hero" action={action} method="get" role="search">
      <div className="field">
        <label htmlFor="q">Nom ou spécialité</label>
        <input className="form-input" id="q" name="q" defaultValue={values.q ?? ''} placeholder="Ex. pédiatrie, Dr Ilunga" />
      </div>
      <div className="field">
        <label htmlFor="specialite">Spécialité</label>
        <select className="form-input" id="specialite" name="specialite" defaultValue={values.specialite ?? ''}>
          <option value="">Toutes</option>
          {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="commune">Commune</label>
        <select className="form-input" id="commune" name="commune" defaultValue={values.commune ?? ''}>
          <option value="">Toutes</option>
          {communes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="dispo">Disponibilité</label>
        <select className="form-input" id="dispo" name="dispo" defaultValue={values.dispo ?? ''}>
          <option value="">Peu importe</option>
          <option value="48h">Sous 48 heures</option>
          <option value="7j">Cette semaine</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="tri">Trier par</label>
        <select className="form-input" id="tri" name="tri" defaultValue={values.tri ?? 'dispo'}>
          <option value="dispo">Disponible au plus tôt</option>
          <option value="tarif">Tarif croissant</option>
          <option value="nom">Nom A–Z</option>
        </select>
      </div>
      <button className="btn btn-primary" type="submit"><Icon name="search" /> Rechercher</button>
    </form>
  )
}
