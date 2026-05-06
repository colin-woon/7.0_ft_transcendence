import LoginPage from '@/features/auth/ui/login/LoginPage'
import { getServerCurrentUser } from '@/features/auth/api/serverAuthData'
import { redirect } from 'next/navigation'

// export const dynamic = 'force-dynamic'

interface LoginRouteProps {
  searchParams: Promise<{ error?: string | string[] }>
}

function extractErrorParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => entry && entry.trim())
    return first ? first.trim() : null
  }
  return null
}

export default async function LoginRoute({ searchParams }: LoginRouteProps) {
  const profileResult = await getServerCurrentUser()
  if (profileResult.ok && profileResult.data) {
    redirect('/profile')
  }

  const params = await searchParams
  const routeError = extractErrorParam(params.error)

  return <LoginPage routeError={routeError} />
}
