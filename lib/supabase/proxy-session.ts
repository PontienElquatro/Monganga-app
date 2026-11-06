import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PRIVATE_PREFIXES = ['/paiement-test', '/patient', '/medecin', '/admin', '/dossier', '/notifications']

/** Rafraîchit la session à chaque requête et renvoie vers la connexion si l'espace est privé. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  if (!data.user && PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))) {
    const login = request.nextUrl.clone()
    login.pathname = '/connexion'
    login.search = ''
    login.searchParams.set('suite', path + request.nextUrl.search)
    return NextResponse.redirect(login)
  }
  return response
}
