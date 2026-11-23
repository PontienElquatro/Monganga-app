import 'server-only'
import { cleanSupabaseUrl } from '@/lib/supabase/url'

// Les noms sont écrits en entier (process.env.NOM) : c'est la seule forme que Next.js et Cloudflare lisent correctement.
function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

/** Lecture centralisée de la configuration. Les services absents passent en mode test. */
export const env = {
  siteUrl: () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  supabaseUrl: () => cleanSupabaseUrl(required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')),
  supabaseAnonKey: () => required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  serviceRoleKey: () => required(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY'),
  cronSecret: () => process.env.CRON_SECRET || '',
  paymentProvider: (): 'test' | 'maishapay' => (process.env.PAYMENT_PROVIDER === 'maishapay' ? 'maishapay' : 'test'),
  daily: () => ({ apiKey: process.env.DAILY_API_KEY || '', domain: process.env.DAILY_DOMAIN || '' }),
  resend: () => ({ apiKey: process.env.RESEND_API_KEY || '' }),
  cloudinary: () => ({
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  }),
}

export const modes = {
  paymentsAreTest: () => env.paymentProvider() === 'test',
  videoIsTest: () => !env.daily().apiKey || !env.daily().domain,
  emailIsTest: () => !env.resend().apiKey,
  photosEnabled: () => Boolean(env.cloudinary().cloudName && env.cloudinary().apiKey && env.cloudinary().apiSecret),
}
