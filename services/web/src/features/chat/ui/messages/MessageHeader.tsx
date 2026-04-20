'use client';

import React from 'react';
import { useCurrentChatSession, useUserStatus, BUBBLE_COLORS } from '@/features/chat/models';
import { AvatarWithStatus, FriendOptionsDropdown } from '@/features/chat/ui';

export function MessageHeader() {
  const { chatSessionName, friendIds, currentUserId, chatId } = useCurrentChatSession();

  // Find the ID of the person we are chatting with (if it's a 1-on-1)
  const otherUserId = friendIds?.find((id) => id !== currentUserId);

  // Safely grab the online status. If otherUserId is undefined (like in a group), we just pass -1
  const isOnline = useUserStatus(otherUserId || -1);

  // Determine chat type and derived UI state
  const isGroup = friendIds?.length > 2 || !!chatSessionName;
  
  let title = 'Active Conversation';
  let statusText = '...';
  let isStatusPositive = false;
  let avatarChar = '#';

  if (isGroup) {
    title = chatSessionName || 'Group Chat';
    statusText = `${friendIds?.length} members`;
    isStatusPositive = false; // Usually groups don't show a green "Online"
    avatarChar = title.charAt(0).toUpperCase();
  } else if (otherUserId) {
    title = `User #${otherUserId}`;
    statusText = isOnline ? 'Online' : 'Offline';
    isStatusPositive = isOnline;
    avatarChar = `${otherUserId}`.charAt(0);
  }

  const color = BUBBLE_COLORS[otherUserId! % BUBBLE_COLORS.length];

  return (
    <div className="h-[73px] border-b border-base-300 flex justify-between items-center px-4 md:px-6 bg-base-100/95 backdrop-blur-md z-10 shadow-sm shrink-0">
      
      <div className="flex items-center">
        {/* Mobile Back Button */}
        <div className="md:hidden mr-2">
          <button 
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => window.history.back()}
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>

        <div className='mr-2'>  
        <AvatarWithStatus           
            userId={otherUserId}
            chatId={chatId!}
            name={`Friend #${otherUserId}`}
            color={color}
            initials={title}
            isGroup={isGroup}
            />
        </div>

        {/* User / Group Info */}
        <div className="flex flex-col">
          <div className="font-semibold text-md leading-tight">{title}</div>
          <div className={`text-xs font-medium ${isStatusPositive ? 'text-success' : 'text-base-content/60'}`}>
            {statusText}
          </div>
        </div>
      </div>

      {!isGroup &&
        <FriendOptionsDropdown friendId={otherUserId!} />
      }
    </div>
  );
}