import ProfilePage from '@/features/auth/ui/profile/ProfilePage'
import { getServerUserById } from '@/features/auth/api/serverAuthData'
import { notFound } from 'next/navigation'

// export const dynamic = 'force-dynamic'

interface UserProfileRouteProps {
  params: Promise<{ id: string }>
}

export default async function UserProfileRoute({ params }: UserProfileRouteProps) {
  const { id } = await params
  if (!/^\d+$/.test(id)) {
    notFound()
  }

  const userId = Number(id)

  if (!Number.isFinite(userId) || !Number.isInteger(userId) || userId <= 0) {
    notFound()
  }

  const profileResult = await getServerUserById(userId)

  return (
    <ProfilePage
      viewedUserId={userId}
      initialProfile={profileResult.ok ? profileResult.data : null}
      initialProfileError={profileResult.ok ? null : profileResult.error}
      initialProfileErrorStatus={profileResult.ok ? null : profileResult.status}
    />
  )
}
