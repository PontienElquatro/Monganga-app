import 'server-only'
import { env } from '@/lib/config'
import { maishapayProvider } from './maishapay'
import { testProvider } from './test'
import type { PaymentProvider } from './types'

const providers: Record<string, PaymentProvider> = {
  test: testProvider,
  maishapay: maishapayProvider,
}

export function currentProvider(): PaymentProvider {
  return providers[env.paymentProvider()]
}

export function providerByName(name: string): PaymentProvider | null {
  return providers[name] ?? null
}
