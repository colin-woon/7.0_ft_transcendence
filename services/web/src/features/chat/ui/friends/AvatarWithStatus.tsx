'use client';

import React from 'react';
import { useHasUnreadMessages, useUserStatus } from '@/features/chat/models';
import type { FriendId, ChatId } from '@/features/chat/models';

interface AvatarWithStatusProps {
  userId?: FriendId;
  chatId?: ChatId;
  name: string;
  initials?: string;
  color?: string;
  avatarUrl?: string;
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
  status // Optional: pass the specific string status from your data
}: AvatarWithStatusProps & { status?: string }) {
  const isOnline = useUserStatus(userId ?? -1); // Fallback to -1 if userId is undefined
  const hasUnread = useHasUnreadMessages(chatId ?? null);
  
  const fallbackInitials = initials || name.charAt(0).toUpperCase();

  return (
    <div className="indicator">
      {/* Unread Badge (Top Right) */}
      {hasUnread && (
        <span className="indicator-item badge badge-error badge-sm px-1 z-10 transform translate-x-1 -translate-y-1 border-base-100 border-2" />
      )}
      
      <span className={`indicator-item indicator-bottom indicator-end status status-lg z-10 transform -translate-x-1 border-base-100 border-2 ${getStatusColorClass(status, isOnline)}`} />
      
      {/* Avatar Container */}
      <div className="avatar placeholder">
        <div className={`w-10 rounded-full ${color} text-neutral-50`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} />
          ) : (
            <span className="text-sm align-center font-medium">{fallbackInitials}</span>
          )}
        </div>
      </div>
    </div>
  );
}