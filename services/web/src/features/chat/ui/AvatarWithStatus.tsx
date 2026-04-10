'use client';

import React from 'react';
import { useUserOnlineStatus, useHasUnreadMessages } from '../models';
import type { FriendId, ChatId } from '../models/chat-types';

interface AvatarWithStatusProps {
  userId?: FriendId;       // Used to lookup online status
  chatId?: ChatId;         // Used to lookup unread message badge
  name: string;
  initials?: string;
  color?: string;          // Tailwind bg color e.g. 'bg-emerald-500'
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg'; // Could easily map to sizing classes if desired
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
  size = 'md',
  status // Optional: pass the specific string status from your data
}: AvatarWithStatusProps & { status?: string }) {
  const isOnline = useUserOnlineStatus(userId ?? -1);
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