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

export const metadata: Metadata = {
  title: { default: 'MONGANGA — Consultation médicale en visio', template: '%s · MONGANGA' },
  description: 'Monganga na yo, na tshombo na yo. Consultez un médecin vérifié en visio depuis votre téléphone, à Kinshasa.',
  applicationName: 'MONGANGA',
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
