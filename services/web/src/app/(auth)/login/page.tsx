import LoginPage from '@/features/auth/ui/login/LoginPage'
import { getServerCurrentUser } from '@/features/auth/api/serverAuthData'
import { redirect } from 'next/navigation'

// export const dynamic = 'force-dynamic'

export default async function LoginRoute() {
  const profileResult = await getServerCurrentUser()
  if (profileResult.ok && profileResult.data) {
    redirect('/profile')
  }

  return <LoginPage />
}
