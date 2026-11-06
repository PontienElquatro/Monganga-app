'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Rafraîchit la page à intervalle régulier (attente d'une confirmation de paiement, par exemple). */
export function AutoRefresh({ seconds = 5, maxMinutes = 5 }: { seconds?: number; maxMinutes?: number }) {
  const router = useRouter()
  useEffect(() => {
    const started = Date.now()
    const id = setInterval(() => {
      if (Date.now() - started > maxMinutes * 60_000) return clearInterval(id)
      router.refresh()
    }, seconds * 1000)
    return () => clearInterval(id)
  }, [router, seconds, maxMinutes])
  return null
}
