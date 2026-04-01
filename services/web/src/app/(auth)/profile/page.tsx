import ProfilePage from '@/features/auth/ui/profile/ProfilePage3'
import { getServerCurrentUser, getServerSessions } from '@/features/auth/api/serverAuthData'

export const dynamic = 'force-dynamic'

export default async function ProfileRoute() {
  const [profileResult, sessionsResult] = await Promise.all([
    getServerCurrentUser(),
    getServerSessions(),
  ])

  const initialProfile = profileResult.ok ? profileResult.data : null
  const initialProfileErrorStatus = profileResult.ok || profileResult.status === 401 ? null : profileResult.status
  const initialProfileError = initialProfileErrorStatus ? profileResult.error : null

  return (
    <ProfilePage
      initialProfile={initialProfile}
      initialProfileError={initialProfileError}
      initialProfileErrorStatus={initialProfileErrorStatus}
      initialSessions={sessionsResult.ok && sessionsResult.data ? sessionsResult.data : undefined}
    />
  )
}
