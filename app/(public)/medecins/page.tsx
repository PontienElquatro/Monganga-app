import type { Metadata } from 'next'
import { DoctorCard } from '@/components/doctors/doctor-card'
import { DoctorFilters } from '@/components/doctors/doctor-filters'
import { EmptyState } from '@/components/ui/empty-state'
import { getSpecialtiesAndCommunes, listDoctors, type DoctorFilters as Filters } from '@/lib/doctors'

export const metadata: Metadata = { title: 'Nos médecins' }

export default async function MedecinsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = await searchParams
  const [doctors, options] = await Promise.all([listDoctors(filters), getSpecialtiesAndCommunes()])
  return (
    <section className="container section">
      <h1 className="h1 mb-2">Nos médecins</h1>
      <p className="text-2 mb-6">Tous nos médecins ont été vérifiés : identité, diplôme et inscription à l’Ordre.</p>
      <DoctorFilters action="/medecins" values={filters} {...options} />
      <div className="results-toolbar"><h2>{doctors.length} médecin{doctors.length > 1 ? 's' : ''}</h2></div>
      {doctors.length ? (
        <div className="doctor-grid">
          {doctors.map((d) => <DoctorCard key={d.id} doctor={d} href={`/medecins/${d.id}`} />)}
        </div>
      ) : (
        <EmptyState icon="search" title="Aucun médecin trouvé" text="Essayez une autre spécialité ou une autre commune." />
      )}
    </section>
  )
}
