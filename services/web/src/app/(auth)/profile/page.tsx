import ProfilePage from '@/features/auth/ui/profile/ProfilePage'
import { getServerCurrentUser } from '@/features/auth/api/serverAuthData'

export const dynamic = 'force-dynamic'

export default async function ProfileRoute() {
  const profileResult = await getServerCurrentUser()

  const initialProfile = profileResult.ok ? profileResult.data : null
  const initialProfileErrorStatus = profileResult.ok || profileResult.status === 401 ? null : profileResult.status
  const initialProfileError = initialProfileErrorStatus ? profileResult.error : null

  return (
    <ProfilePage
      initialProfile={initialProfile}
      initialProfileError={initialProfileError}
      initialProfileErrorStatus={initialProfileErrorStatus}
    />
  )
}
