'use client'

import { UserPlus, UserCheck } from 'lucide-react'
import { useIsAcceptedFriend } from '@/features/chat/models/chat-hooks'
import { sendFriendRequest } from '@/features/chat/api/chat-services'
import { FriendId } from '@/features/chat/models/chat-types'
import { useState } from 'react'

interface AddFriendButtonProps {
  targetUserId: FriendId
}

export function AddFriendButton({ targetUserId }: AddFriendButtonProps) {
  const isFriend = useIsAcceptedFriend(targetUserId)
  const [isSending, setIsSending] = useState(false)

  const handleAddFriend = async () => {
    try {
      setIsSending(true)
      await sendFriendRequest(targetUserId)
    } catch (error) {
      console.error('Failed to send friend request:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (isFriend) {
    return (
      <button 
        className="btn btn-circle btn-sm btn-success text-base-content tooltip"
        data-tip="Already friends"
      >
        <UserCheck size={16} />
      </button>
    )
  }

  return (
    <button 
      className={`btn btn-circle btn-sm btn-primary ${isSending ? 'loading' : ''} text-base-content tooltip`}
      onClick={handleAddFriend}
      disabled={isSending}
      data-tip="Add friend"
    >
      {!isSending && <UserPlus size={16} />}
    </button>
  )
}