import type { MetadataRoute } from 'next'

const SITE = 'https://monganga.org'

/** Moteurs de recherche : pages publiques ouvertes, espaces privés fermés. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/medecin/', '/patient/', '/espace', '/notifications', '/api/', '/auth/', '/dossier', '/compte-suspendu',
        '/paiement-test', '/reinitialiser', '/verification-email', '/mot-de-passe-oublie'],
    }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
