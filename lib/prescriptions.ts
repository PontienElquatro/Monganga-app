import 'server-only'
import QRCode from 'qrcode'
import { env } from '@/lib/config'

export const verifyUrl = (code: string) => `${env.siteUrl()}/verifier/${encodeURIComponent(code)}`

export async function qrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(verifyUrl(code), { margin: 1, width: 240, errorCorrectionLevel: 'M' })
}
