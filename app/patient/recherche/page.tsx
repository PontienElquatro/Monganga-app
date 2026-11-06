import type { Metadata } from 'next'
import { DoctorCard } from '@/components/doctors/doctor-card'
import { DoctorFilters } from '@/components/doctors/doctor-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { getSpecialtiesAndCommunes, listDoctors, type DoctorFilters as Filters } from '@/lib/doctors'

export const metadata: Metadata = { title: 'Trouver un médecin' }

export default async function RecherchePage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams
  const [doctors, options] = await Promise.all([listDoctors(filters), getSpecialtiesAndCommunes()])
  return (
    <>
      <h1 className="pat-page-title">Trouvez votre médecin</h1>
      <p className="pat-page-sub mb-6">Une spécialité, un créneau, une consultation depuis chez vous.</p>
      <DoctorFilters action="/patient/recherche" values={filters} {...options} />
      <div className="results-toolbar"><h2>{doctors.length} médecin{doctors.length > 1 ? 's' : ''}</h2></div>
      {doctors.length ? (
        <div className="doctor-grid">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} href={`/patient/medecins/${d.id}`} />)}
        </div>
      ) : (
        <EmptyState icon="search" title="Aucun médecin trouvé" text="Essayez une autre spécialité ou une autre commune." />
      )}
    </>
  )
}
