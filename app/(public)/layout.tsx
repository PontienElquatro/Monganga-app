import { PublicHeader } from '@/components/layout/public-header'
import { PublicFooter } from '@/components/layout/public-footer'
import { getSession, homeFor } from '@/lib/auth'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  return (
    <>
      <PublicHeader spaceHref={session ? homeFor(session) : null} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <PublicFooter />
    </>
  )
}
