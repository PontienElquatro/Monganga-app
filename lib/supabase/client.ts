'use client'
import { createBrowserClient } from '@supabase/ssr'
import { cleanSupabaseUrl } from './url'

/** Client Supabase du navigateur (temps réel, envoi de fichiers). La RLS s'applique. */
export function createClient() {
  return createBrowserClient(cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
