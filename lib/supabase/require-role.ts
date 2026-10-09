import { redirect } from 'next/navigation'
import { getCurrentUser } from './get-user'

export async function requireRole(roles: Array<'patient' | 'medecin' | 'admin'>) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (!roles.includes(user.role)) redirect('/')
  return user
}