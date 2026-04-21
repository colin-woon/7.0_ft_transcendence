import ProfilePage from '@/features/auth/ui/profile/ProfilePage'
import { getServerCurrentUser } from '@/features/auth/api/serverAuthData'

// export const dynamic = 'force-dynamic'

export default async function ProfileRoute() {
  const profileResult = await getServerCurrentUser()

  const shouldExposeInitialProfileError =
    !profileResult.ok &&
    profileResult.status !== 401 &&
    profileResult.status < 500

  const initialProfile = profileResult.ok ? profileResult.data : null
  const initialProfileErrorStatus = shouldExposeInitialProfileError
    ? profileResult.status
    : null
  const initialProfileError = shouldExposeInitialProfileError
    ? profileResult.error
    : null

  return (
    <ProfilePage
      initialProfile={initialProfile}
      initialProfileError={initialProfileError}
      initialProfileErrorStatus={initialProfileErrorStatus}
    />
  )
}
