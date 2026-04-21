"use client";

import { type Friendship, useUserDisplay } from "@/features/chat/models";
import {
  AvatarWithStatus,
  DirectMessageButton,
  FriendOptionsDropdown,
} from "@/features/chat/ui";

export interface FriendCardProps {
  friend: Friendship;
  isPending?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  onActionComplete?: () => void;
}

export function FriendCard({
  friend,
  isPending,
  onAccept,
  onDecline,
  onActionComplete,
}: FriendCardProps) {
  const resolveUserDisplay = useUserDisplay([friend.friendId]);
  const resolvedUser = resolveUserDisplay(friend.friendId);

  return (
    <div className="group flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors border-t border-transparent hover:border-base-300/50">
      {/* Left Side: Avatar & Info */}
      <div className="flex items-center gap-3 w-1/2 min-w-0">
        <AvatarWithStatus
          userId={friend.friendId}
          chatId={friend.chatId}
          name={resolvedUser.displayName}
          color="bg-primary"
          avatarImage={resolvedUser.avatarImage}
        />
        <div className="flex flex-col truncate">
          <span className="font-semibold text-base-content truncate">
            {resolvedUser.displayName}
          </span>
          <span className="text-xs text-base-content/60 truncate">
            {friend.isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Right Side: Quick Actions & Dropdown */}
      <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
        {isPending ? (
          <>
            <button
              type="button"
              onClick={onDecline}
              className="btn btn-circle btn-sm btn-ghost bg-error/20 text-error hover:bg-error hover:text-error-content tooltip"
              data-tip="Decline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="btn btn-circle btn-sm btn-ghost bg-success/20 text-success hover:bg-success hover:text-success-content tooltip"
              data-tip="Accept"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            </button>
          </>
        ) : (
          <>
            <DirectMessageButton chatId={friend.chatId} />
            <FriendOptionsDropdown
              friendId={friend.friendId}
              onActionComplete={onActionComplete}
            />
          </>
        )}
      </div>
    </div>
  );
}
