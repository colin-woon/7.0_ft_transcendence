'use client'

import { UserPlus, UserCheck, Clock, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useAllFriendshipStatuses, useChatActions } from '@/features/chat/models/chat-hooks'
import { sendFriendRequest } from '@/features/chat/api/chat-services'
import { FriendId } from '@/features/chat/models/chat-types'

interface AddFriendButtonProps {
  targetUserId: FriendId
}

// 1. Grab the dictionary of all statuses
// 2. Grab the action to update the store
// 3. Extract the exact status for THIS user. Default to 'none' if undefined.
export function AddFriendButton({ targetUserId }: AddFriendButtonProps) {
  const statuses = useAllFriendshipStatuses()
  const { setFriendshipStatus } = useChatActions()
  const [isSending, setIsSending] = useState(false)
  const status = statuses[targetUserId] || 'none'

  // 4. Success! Tell Zustand to update this specific user to 'pending'
  // This immediately forces this component to re-render as the yellow Clock button.
  const handleAddFriend = async () => {
    try {
      setIsSending(true)
      await sendFriendRequest(targetUserId)
      setFriendshipStatus(targetUserId, 'pending')
    } catch (error) {
      console.error('Failed to send friend request:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (status === 'accepted') {
    return (
      <button 
        className="btn btn-circle btn-sm btn-success text-base-content tooltip"
        data-tip="Already friends"
      >
        <UserCheck size={16} />
      </button>
    )
  }

  if (status === 'pending') {
    return (
      <button 
        className="btn btn-circle btn-sm btn-warning text-base-content tooltip"
        data-tip="Request sent"
        disabled // Prevent them from clicking it again
      >
        <Clock size={16} />
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