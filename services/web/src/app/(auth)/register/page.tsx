import RegisterPage from '@/features/auth/ui/login/RegisterPage'
import { getServerCurrentUser } from '@/features/auth/api/serverAuthData'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface RegisterRouteProps {
  searchParams: Promise<{ email?: string | string[] }>
}

export default async function RegisterRoute({ searchParams }: RegisterRouteProps) {
  const profileResult = await getServerCurrentUser()
  if (profileResult.ok && profileResult.data) {
    redirect('/profile')
  }

  const params = await searchParams
  const normalizedEmail = Array.isArray(params.email)
    ? (params.email[0] ?? '')
    : (params.email ?? '')
  return <RegisterPage initialEmail={normalizedEmail} />
}
