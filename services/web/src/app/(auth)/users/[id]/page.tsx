import ProfilePage from '@/features/auth/ui/profile/ProfilePage'
import { notFound } from 'next/navigation'

interface UserProfileRouteProps {
  params: Promise<{ id: string }>
}

export default async function UserProfileRoute({ params }: UserProfileRouteProps) {
  const { id } = await params
  const userId = Number(id)

  if (!Number.isFinite(userId) || userId <= 0) {
    notFound()
  }

  return <ProfilePage viewedUserId={userId} />
}
