import 'server-only'
import { createHash } from 'node:crypto'
import { env } from '@/lib/config'

/** Signature d'envoi direct d'une photo de profil vers Cloudinary (le secret ne quitte jamais le serveur). */
export function signAvatarUpload(userId: string) {
  const { cloudName, apiKey, apiSecret } = env.cloudinary()
  const timestamp = Math.floor(Date.now() / 1000)
  const params: Record<string, string | number> = {
    folder: 'monganga/avatars',
    overwrite: 'true',
    public_id: userId,
    timestamp,
    transformation: 'c_fill,g_face,w_400,h_400,q_auto,f_auto',
  }
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&')
  const signature = createHash('sha1').update(toSign + apiSecret).digest('hex')
  return { cloudName, apiKey, signature, ...params }
}

/** N'accepte que des images de notre propre compte Cloudinary. */
export function isOwnCloudinaryUrl(url: string): boolean {
  const { cloudName } = env.cloudinary()
  return Boolean(cloudName) && url.startsWith(`https://res.cloudinary.com/${cloudName}/image/upload/`)
}
