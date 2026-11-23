import { Icon } from '@/components/ui/icon'
import { dateLong } from '@/lib/format'
import type { Prescription } from '@/lib/types'

/** Ordonnance à l'écran, au format de la maquette (le PDF reprend la même mise en page). */
export function PrescriptionTicket({ rx, patientName, doctorName, doctorSpecialty, qrDataUrl }: {
  rx: Prescription
  patientName: string
  doctorName: string
  doctorSpecialty: string
  qrDataUrl: string
}) {
  return (
    <article className="v3-ticket">
      <header>
        <img src="/logo/monganga-icon-192.png" alt="" />
        <div><strong>ORDONNANCE</strong><span>MONGANGA na Tshombo</span></div>
        <span className="chip-rdc"><Icon name="shield-check" /> Vérifiable</span>
      </header>
      <div className="v3-ticket-meta">
        <div><span>Patient</span><strong>{patientName}</strong></div>
        <div><span>Médecin</span><strong>{doctorName} · {doctorSpecialty}</strong></div>
        <div><span>Date</span><strong>{dateLong(rx.issued_at)}</strong></div>
        <div><span>N°</span><strong>{rx.code}</strong></div>
      </div>
      <ol className="v3-ticket-rx">
        {rx.items.map((it, i) => (
          <li key={i}><strong>{it.name}</strong><span>{[it.dosage, it.duration].filter(Boolean).join(' · ')}</span></li>
        ))}
      </ol>
      {rx.instructions ? <p className="rx-instructions"><strong>Recommandations : </strong>{rx.instructions}</p> : null}
      <footer>
        <div className="v3-qr"><img src={qrDataUrl} alt={`QR code de vérification de l’ordonnance ${rx.code}`} /></div>
        <p>Le pharmacien scanne ce code pour vérifier que l’ordonnance est authentique. Aucune information médicale n’apparaît lors de la vérification.</p>
      </footer>
      <div className="v3-ticket-expire"><Icon name="hourglass" /> Disponible jusqu’au {dateLong(rx.expires_at)}</div>
    </article>
  )
}
