import type { Metadata, Viewport } from 'next'
import './styles/fonts.css'
import './styles/styles.css'
import './styles/animations.css'
import './styles/ui.css'
import './styles/patient.css'
import './styles/doctor.css'
import './styles/restored.css'
import './styles/marque.css'
import './styles/pages.css'
import './styles/app.css'

const DESCRIPTION = 'MONGANGA, la téléconsultation médicale en RDC : consultez un médecin congolais vérifié en visio depuis votre téléphone, à Kinshasa. Paiement Mobile Money, ordonnance en ligne.'

export const metadata: Metadata = {
  metadataBase: new URL('https://monganga.org'),
  title: { default: 'MONGANGA — Téléconsultation médicale en RDC, médecin en visio à Kinshasa', template: '%s · MONGANGA' },
  description: DESCRIPTION,
  applicationName: 'MONGANGA',
  keywords: ['MONGANGA', 'monganga', 'téléconsultation RDC', 'médecin en ligne Kinshasa', 'consultation vidéo', 'médecin congolais', 'santé RDC', 'Monganga na yo'],
  openGraph: {
    type: 'website', locale: 'fr_CD', url: 'https://monganga.org', siteName: 'MONGANGA',
    title: 'MONGANGA — Téléconsultation médicale en RDC', description: DESCRIPTION,
    images: [{ url: '/images/medecin-teleconsultation.webp', width: 1600, height: 1067, alt: 'Médecin congolais en téléconsultation' }],
  },
  twitter: { card: 'summary_large_image', title: 'MONGANGA — Téléconsultation médicale en RDC', description: DESCRIPTION, images: ['/images/medecin-teleconsultation.webp'] },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0D2238',
}

// Applique le thème clair/sombre avant l'affichage pour éviter un flash.
const themeScript = `try{var t=localStorage.getItem('monganga-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        {children}
      </body>
    </html>
  )
}
