'use client'

import { UserPlus, UserCheck, Clock, UserCog, Ban, Check } from 'lucide-react'
import { useState } from 'react'
import { useAllFriendshipStatuses, useChatActions } from '@/features/chat/models/chat-hooks'
import { sendFriendRequest, updateFriendshipStatus } from '@/features/chat/api/chat-services'
import { FriendId } from '@/features/chat/models/chat-types'
import { useAuth } from '@/features/auth/models/AuthContext'

interface AddFriendButtonProps {
  targetUserId: FriendId
}

// 1. Grab the dictionary of all statuses
// 2. Grab the action to update the store
// 3. Extract the exact status for THIS user. Default to 'none' if undefined.
export function AddFriendButton({ targetUserId }: AddFriendButtonProps) {
  const statuses = useAllFriendshipStatuses()
  const status = statuses[targetUserId]?.status || 'none'
  const lastActionUserId = statuses[targetUserId]?.lastActionUserId
  const { setFriendshipStatus } = useChatActions()
  const [isSending, setIsSending] = useState(false)
  const { user } = useAuth();

  // 4. Success! Tell Zustand to update this specific user to 'pending'
  // This immediately forces this component to re-render as the yellow Clock button.
  const handleAddFriend = async () => {
    try {
      setIsSending(true)
      await sendFriendRequest(targetUserId)
      setFriendshipStatus(targetUserId, 'pending', user!.id) 
    } catch (error) {
      console.error('Failed to send friend request:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleUnblock = async () => {
    try {
      setIsSending(true)
      await updateFriendshipStatus(targetUserId, 'requested')
      setFriendshipStatus(targetUserId, 'requested', user!.id) 
    } catch (error) {
      console.error('Failed to unblock user:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleAccept = async () => {
    try {
      setIsSending(true)
      await updateFriendshipStatus(targetUserId, 'accepted')
      setFriendshipStatus(targetUserId, 'accepted', user!.id) 
    } catch (error) {
      console.error('Failed to accept friend request:', error)
    } finally {
      setIsSending(false)
    }
  }

  if (status === 'accepted') {
    return (
      <div 
        className="btn btn-circle btn-sm btn-success text-base-content tooltip"
        data-tip="Already friends"
      >
        <Check size={16} />
      </div> 
    )
  }

  if (status === 'pending') {
    if ( lastActionUserId === user?.id) {
      return (
        <button 
          className="btn btn-circle btn-sm text-base-content tooltip"
          data-tip="Request sent"
          disabled // Prevent them from clicking it again
        >
          <Clock size={16} />
        </button>
      )
    }
    return (
      <button 
        className="btn btn-circle btn-sm btn-success text-base-content tooltip"
        data-tip="Accept"
        disabled={isSending}
        onClick={handleAccept}
      >
        <UserCheck size={16} />
      </button>
    )
  }
  
  if (status === 'blocked') {
    if ( lastActionUserId === user?.id) {
      return (
        <button 
          className="btn btn-circle btn-sm btn-error text-base-content tooltip"
          data-tip="Unblock"
          disabled={isSending}
          onClick={handleUnblock}
        >
          <Ban size={16} />
        </button>
      )    
    }
    return null;
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