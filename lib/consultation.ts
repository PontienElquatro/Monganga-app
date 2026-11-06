import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { ChatMessage, SharedFile } from '@/components/consultation/room'
import type { ConsultationContext } from '@/lib/types'

/** Contexte de la salle, messages et documents (la RLS limite aux deux participants). */
export async function loadConsultation(id: string): Promise<{ ctx: ConsultationContext; messages: ChatMessage[]; files: SharedFile[] } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const supabase = await createClient()
  const { data: ctx } = await supabase.rpc('consultation_context', { p_appointment: id }).maybeSingle<ConsultationContext>()
  if (!ctx) return null
  const [m, f] = await Promise.all([
    supabase.from('consultation_messages').select('id, sender_id, body, created_at').eq('appointment_id', id).order('created_at').limit(500),
    supabase.from('consultation_files').select('id, uploader_id, storage_path, file_name, size_bytes, created_at').eq('appointment_id', id).order('created_at').limit(100),
  ])
  return { ctx, messages: (m.data ?? []) as ChatMessage[], files: (f.data ?? []) as SharedFile[] }
}
