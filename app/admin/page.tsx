import { requireRole } from '@/lib/supabase/require-role'
import { signOut } from '../auth/actions'

export default async function AdminPage() {
  const user = await requireRole(['admin'])
  return (
    <main style={{ padding: 20 }}>
      <p>Admin connecté : {user.full_name || user.id}</p>
      <form action={signOut}>
        <button>Se déconnecter</button>
      </form>
    </main>
  )
}