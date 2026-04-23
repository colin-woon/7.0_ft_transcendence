'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { updateFriendshipStatus } from '@/features/chat/api';
import { useIsAcceptedFriend } from '@/features/chat/models/chat-hooks';

interface FriendOptionsDropdownProps {
  friendId: number;
  onActionComplete?: () => void;
  isProfilePage?: boolean;
}

export function FriendOptionsDropdown({ friendId, onActionComplete, isProfilePage = false }: FriendOptionsDropdownProps) {
  const router = useRouter();
  const isFriend = useIsAcceptedFriend(friendId);

  const handleRemoveFriend = async () => {
    try {
      await updateFriendshipStatus(friendId, 'requested');
      onActionComplete?.();
    } catch (error) {
      console.error('Failed to update friendship status:', error);
    }
  };

  const handleBlockFriend = async () => {
    try {
      await updateFriendshipStatus(friendId, 'blocked');
      onActionComplete?.();
    } catch (error) {
      console.error('Failed to update friendship status:', error);
    }
  };

  if (!isFriend && isProfilePage) {
    return null;
  }

  return (
    <div className="dropdown dropdown-end">
      <label 
        tabIndex={0} 
        className="btn btn-circle btn-sm btn-ghost bg-base-200 border border-base-300 text-base-content hover:bg-base-300 tooltip"
        data-tip="More"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
        </svg>
      </label>
      <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow-lg bg-base-200 rounded-box w-48 mt-1 border border-base-300">
        {!isProfilePage && (
          <li><a onClick={() => router.push(`/users/${friendId}`)}>View Profile</a></li>
        )}
        {!isProfilePage && isFriend && (
          <div className="divider my-0"></div>
        )}
        {isFriend && (
          <>
            <li><a onClick={handleRemoveFriend} className="text-error hover:bg-error/20 hover:text-error">Remove Friend</a></li>
            <li><a onClick={handleBlockFriend} className="text-error hover:bg-error/20 hover:text-error">Block User</a></li>
          </>
        )}
      </ul>
    </div>
  );
}