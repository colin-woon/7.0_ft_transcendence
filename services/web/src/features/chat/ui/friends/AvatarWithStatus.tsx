'use client';

import React from 'react';
import { useHasUnreadMessages, useUserStatus, useIsAcceptedFriend } from '@/features/chat/models';
import type { FriendId, ChatId } from '@/features/chat/models';

interface AvatarWithStatusProps {
  userId?: FriendId;
  chatId?: ChatId;
  name: string;
  initials?: string;
  color?: string;
  avatarUrl?: string;
  isGroup?: boolean;
}

// Updated Helper for dynamic status colors
const getStatusColorClass = (status?: string, isOnline?: boolean) => {
  if (!isOnline) return 'bg-slate-500'; // Default/Offline (gray)
  switch (status) {
    case 'Online': return 'status-success';
    case 'Idle': return 'status-warning';
    case 'Do Not Disturb': return 'status-error';
    default: return 'status-success'; 
  }
};

export function AvatarWithStatus({
  userId,
  chatId,
  name,
  initials,
  color = 'bg-base-200',
  avatarUrl,
  status,
  isGroup = false
}: AvatarWithStatusProps & { status?: string }) {
  const isAcceptedFriend = useIsAcceptedFriend(userId ?? null);
  const isOnline = useUserStatus(userId ?? -1); 
  const hasUnread = useHasUnreadMessages(chatId ?? null);
  
  const fallbackInitials = initials || name.charAt(0).toUpperCase();

  return (
    <div className="indicator">
      {/* Unread Badge (Top Right)*/}
      {hasUnread && (
        <span className="indicator-item badge badge-error badge-sm px-1 z-10 transform translate-x-1 -translate-y-1 border-base-100 border-2" />
      )}
      
      {/* Status Dot (Bottom Right) */}
      {!isGroup && isAcceptedFriend && (
        <span className={`indicator-item indicator-bottom indicator-end status status-lg z-10 transform -translate-x-1 border-base-100 border-2 ${getStatusColorClass(status, isOnline)}`} />
      )}

      {/* Avatar Container */}
      <div className="avatar placeholder">
        <div className={`w-10 rounded-full ${color} text-neutral-content flex items-center justify-center font-bold`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-md">{fallbackInitials}</span>
          )}
        </div>
      </div>
    </div>
  );
}