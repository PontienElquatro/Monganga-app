import Script from 'next/script';

export const metadata = {
  title: 'MONGANGA — Téléconsultation médicale',
  description: 'Téléconsultation médicale à Kinshasa.',
  icons: { icon: '/assets/logo/monganga-icone.jpg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" data-theme="light" suppressHydrationWarning>
      <head><meta name="app-base" content="/" /></head>
      <body suppressHydrationWarning>
        <Script src="/assets/js/theme.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
