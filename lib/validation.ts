// Petites vérifications partagées par les formulaires (côté serveur).

export const str = (fd: FormData, key: string, max = 200): string => String(fd.get(key) ?? '').trim().slice(0, max)

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254
export const isPhone = (v: string) => /^[+0-9 ()\-]{9,20}$/.test(v)

export function passwordProblem(p: string): string | null {
  if (p.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return 'Le mot de passe doit contenir au moins une majuscule et un chiffre.'
  return null
}

/** Chemin interne sûr pour une redirection après connexion. */
export function safeNext(v: string | null | undefined): string | null {
  if (!v) return null
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : null
}

/** Convertit « 15,50 » ou « 15.5 » dollars en centimes. */
export function dollarsToCents(v: string): number | null {
  const n = Number(v.replace(',', '.').replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}
