import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/config'

export const dynamic = 'force-dynamic'

const SITE = 'https://monganga.org'

const PAGES: { path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '', priority: 1, freq: 'weekly' },
  { path: '/medecins', priority: 0.9, freq: 'daily' },
  { path: '/comment-ca-marche', priority: 0.8, freq: 'monthly' },
  { path: '/tarifs', priority: 0.8, freq: 'monthly' },
  { path: '/faq', priority: 0.7, freq: 'monthly' },
  { path: '/contact', priority: 0.6, freq: 'yearly' },
  { path: '/inscription', priority: 0.6, freq: 'yearly' },
  { path: '/conditions', priority: 0.3, freq: 'yearly' },
  { path: '/confidentialite', priority: 0.3, freq: 'yearly' },
  { path: '/mentions-legales', priority: 0.3, freq: 'yearly' },
]

/** Plan du site pour Google : pages publiques et fiches des médecins validés. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = PAGES.map((p) => ({
    url: `${SITE}${p.path}`, lastModified: now, changeFrequency: p.freq, priority: p.priority,
  }))
  try {
    const supabase = createClient(env.supabaseUrl(), env.supabaseAnonKey(), { auth: { persistSession: false } })
    const { data } = await supabase.from('doctors_public').select('id').limit(500)
    for (const d of (data ?? []) as { id: string }[]) {
      entries.push({ url: `${SITE}/medecins/${d.id}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 })
    }
  } catch (e) {
    console.error('[sitemap]', e instanceof Error ? e.message : String(e))
  }
  return entries
}
