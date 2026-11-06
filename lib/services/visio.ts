import 'server-only'
import { env, modes } from '@/lib/config'

const API = 'https://api.daily.co/v1'

async function daily(path: string, body: unknown): Promise<Response> {
  return fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.daily().apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
}

export interface VisioAccess {
  mode: 'daily' | 'test'
  url: string | null
}

/**
 * Prépare la salle privée Daily.co du rendez-vous et un accès nominatif qui expire
 * à la fermeture de la salle. Sans clé Daily.co : mode test (pas de vidéo).
 */
export async function getVisioAccess(input: {
  roomName: string
  userName: string
  isDoctor: boolean
  closesAt: string
}): Promise<VisioAccess> {
  if (modes.videoIsTest()) return { mode: 'test', url: null }
  const exp = Math.floor(new Date(input.closesAt).getTime() / 1000)

  const room = await daily('/rooms', {
    name: input.roomName,
    privacy: 'private',
    properties: {
      exp,
      eject_at_room_exp: true,
      max_participants: 2,
      enable_chat: false, // les messages passent par MONGANGA
      enable_screenshare: false,
      enable_prejoin_ui: true,
      lang: 'fr',
    },
  })
  if (!room.ok) {
    const text = await room.text()
    if (!/already exists/i.test(text)) throw new Error(`Daily.co salle : ${room.status} ${text}`)
  }

  const token = await daily('/meeting-tokens', {
    properties: {
      room_name: input.roomName,
      user_name: input.userName,
      is_owner: input.isDoctor,
      exp,
      eject_at_token_exp: true,
    },
  })
  if (!token.ok) throw new Error(`Daily.co jeton : ${token.status} ${await token.text()}`)
  const { token: t } = (await token.json()) as { token: string }
  return { mode: 'daily', url: `https://${env.daily().domain}.daily.co/${input.roomName}?t=${encodeURIComponent(t)}` }
}
