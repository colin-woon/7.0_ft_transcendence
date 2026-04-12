import React from 'react';
import Link from 'next/link';
import { AvatarWithStatus } from '@/features/chat/ui';
import { Friendship } from '@/features/chat/models';

export interface FriendCardProps {
  friend: Friendship;
}

export function FriendCard({ friend }: FriendCardProps) {
  return (
    <div className="group flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors border-t border-transparent hover:border-base-300/50">
      {/* Left Side: Avatar & Info */}
      <div className="flex items-center gap-3 w-1/2 min-w-0">
        <AvatarWithStatus 
          userId={friend.friendId}
          chatId={friend.chatId}
          name={`Friend #${friend.friendId}`}
          color="bg-primary" // Placeholder color
        />
        <div className="flex flex-col truncate">
          <span className="font-semibold text-base-content truncate">Friend #{friend.friendId}</span>
          <span className="text-xs text-base-content/60 truncate">{friend.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Right Side: Quick Actions & Dropdown */}
      <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
        
        {/* Message Quick Action (Links to their DM) */}
        <Link 
          href={`/messages/${friend.chatId}`} 
          className="btn btn-circle btn-sm btn-ghost bg-base-200 border border-base-300 text-base-content hover:bg-base-300 tooltip"
          data-tip="Message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75c-1.63 0-3.17-.393-4.54-1.09l-4.14 1.38 1.38-4.14a9.712 9.712 0 0 1-1.09-4.54Z" />
          </svg>
        </Link>

        {/* More Options Dropdown */}
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
            <li><a>View Profile</a></li>
            <div className="divider my-0"></div>
            <li><a className="text-error hover:bg-error/20 hover:text-error">Remove Friend</a></li>
            <li><a className="text-error hover:bg-error/20 hover:text-error">Block User</a></li>
          </ul>
        </div>

      </div>
    </div>
  );
}
