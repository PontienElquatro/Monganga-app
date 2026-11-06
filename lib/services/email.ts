import 'server-only'
import { env, modes } from '@/lib/config'

export interface EmailMessage {
  to: string
  subject: string
  title: string
  body: string
  link?: string | null
  linkLabel?: string
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

/** Gabarit d'e-mail aux couleurs de MONGANGA (simple, lisible sur téléphone). */
export function renderEmail(m: EmailMessage): { html: string; text: string } {
  const site = env.siteUrl()
  const url = m.link ? (m.link.startsWith('http') ? m.link : site + m.link) : null
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#F1F6FB;font-family:Arial,Helvetica,sans-serif;color:#0F172A">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden">
      <tr><td style="background:#0D2238;padding:18px 24px;color:#ffffff;font-weight:800;font-size:18px;letter-spacing:.3px">
        <img src="${site}/logo/monganga-icon-64.png" width="28" height="28" alt="" style="vertical-align:middle;background:#fff;border-radius:6px;margin-right:8px">MONGANGA
      </td></tr>
      <tr><td style="height:4px;background:#F7D618"></td></tr>
      <tr><td style="padding:24px">
        <h1 style="font-size:19px;margin:0 0 12px">${escapeHtml(m.title)}</h1>
        <p style="font-size:15px;line-height:1.6;margin:0 0 20px;color:#334155">${escapeHtml(m.body)}</p>
        ${url ? `<a href="${url}" style="display:inline-block;background:#0F6EB9;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${escapeHtml(m.linkLabel || 'Ouvrir MONGANGA')}</a>` : ''}
      </td></tr>
      <tr><td style="padding:16px 24px;border-top:1px solid #E2E8F0;font-size:12px;color:#64748B">
        Monganga na yo, na tshombo na yo. Cet e-mail est envoyé automatiquement, merci de ne pas y répondre.
      </td></tr>
    </table>
  </td></tr></table></body></html>`
  const text = `${m.title}\n\n${m.body}${url ? `\n\n${url}` : ''}\n\n— MONGANGA`
  return { html, text }
}

/** Envoie un e-mail via Resend. En mode test (pas de clé), l'e-mail est seulement journalisé. */
export async function sendEmail(m: EmailMessage): Promise<boolean> {
  const { html, text } = renderEmail(m)
  if (modes.emailIsTest()) {
    console.info(`[e-mail test] à ${m.to} — ${m.subject}`)
    return true
  }
  const { apiKey, from } = env.resend()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [m.to], subject: m.subject, html, text }),
  })
  if (!res.ok) {
    console.error('[e-mail] échec', res.status, await res.text().catch(() => ''))
    return false
  }
  return true
}
