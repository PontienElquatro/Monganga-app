import 'server-only'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`)
  return value
}

/** Lecture centralisée de la configuration. Les services absents passent en mode test. */
export const env = {
  siteUrl: () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  serviceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
  cronSecret: () => process.env.CRON_SECRET || '',
  paymentProvider: (): 'test' | 'maishapay' => (process.env.PAYMENT_PROVIDER === 'maishapay' ? 'maishapay' : 'test'),
  daily: () => ({ apiKey: process.env.DAILY_API_KEY || '', domain: process.env.DAILY_DOMAIN || '' }),
  resend: () => ({ apiKey: process.env.RESEND_API_KEY || '', from: process.env.EMAIL_FROM || 'MONGANGA <notifications@monganga.cd>' }),
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
