'use client';

import { useEffect } from 'react';
import { useFriendList, useChatActions, useCurrentChatSession } from '../models';
import { div } from 'framer-motion/client';
import { AvatarWithStatus } from '@/features/chat/ui';

const FALLBACK_AVATAR_URL =
  'https://img.daisyui.com/images/profile/demo/gordon@192.webp';

export function FriendList() {
  const { tempCurrentUserId, allFriendships, isLoading, error } = useFriendList();
  const { fetchAllFriendships, setTempCurrentUserId } = useChatActions();

  useEffect(() => {
    if (tempCurrentUserId) {
      fetchAllFriendships(tempCurrentUserId);
    }
  }, [tempCurrentUserId, fetchAllFriendships]);

  if (isLoading) {
    return <div className="text-sm opacity-70">Loading friends...</div>;
  }

  if (isLoading) {
    return <div className="text-sm opacity-70">Loading friends...</div>;
  }

  if (error) {
    return <div className="text-sm text-error">{error}</div>;
  }

  if (!allFriendships || allFriendships.length === 0) {
    return <div className="text-sm opacity-70">No friends yet.</div>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      <div className='btn btn-primary' onClick={() => setTempCurrentUserId(tempCurrentUserId === 1 ? 2 : 1)}>Switch Temp User</div>
      {allFriendships.map((friend) => {
        return (
          <button
            key={friend.chatId}
            type="button"
            className="flex flex-col items-center gap-2"
          >
            <AvatarWithStatus 
              userId={friend.friendId} 
              chatId={friend.chatId} 
              name={`Friend #${friend.friendId}`} 
              avatarUrl={FALLBACK_AVATAR_URL} 
            />
            <p
              className={[
                'text-xs',
              ].join(' ')}
            >
              Friend #{friend.friendId}
            </p>
          </button>
        );
      })}
    </div>
  );
}