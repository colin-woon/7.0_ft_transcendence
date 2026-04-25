"use client";

import Image from "next/image";
import type { ChatId, FriendId } from "@/features/chat/models";
import {
  useHasUnreadMessages,
  useIsAcceptedFriend,
  useUserStatus,
  useAllFriendshipStatuses,
} from "@/features/chat/models";

interface AvatarWithStatusProps {
  userId?: FriendId;
  chatId?: ChatId;
  name: string;
  initials?: string;
  color?: string;
  avatarImage?: string | null;
  isGroup?: boolean;
}

// Updated Helper for dynamic status colors
const getStatusColorClass = (status?: string, isOnline?: boolean) => {
  if (!isOnline) return "bg-slate-500"; // Default/Offline (gray)
  switch (status) {
    case "Online":
      return "status-success";
    case "Idle":
      return "status-warning";
    case "Do Not Disturb":
      return "status-error";
    default:
      return "status-success";
  }
};

export function AvatarWithStatus({
  userId,
  chatId,
  name,
  initials,
  color = "bg-base-200",
  avatarImage,
  isGroup = false,
}: AvatarWithStatusProps & { status?: string }) {
  const statuses = useAllFriendshipStatuses()
  const status = userId ? (statuses[userId]?.status ?? 'none') : 'none'
  const isAcceptedFriend = useIsAcceptedFriend(userId ?? null);
  const isOnline = useUserStatus(userId ?? -1);
  const hasUnread = useHasUnreadMessages(chatId ?? null);

  const fallbackInitials = initials || name.charAt(0).toUpperCase();

  return (
    <div className="indicator">
      {/* Unread Badge (Top Right)*/}
      {hasUnread && (
        <div className="indicator-item w-2 h-2 bg-error rounded-full z-10 transform translate-x-0.25" />
      )}

      {/* Status Dot (Bottom Right) */}
      {!isGroup && isAcceptedFriend && status === 'accepted' && (
        <span
          className={`indicator-item indicator-bottom indicator-end status status-lg z-10 transform -translate-x-0.25 border-base-100 border-2 ${getStatusColorClass(status, isOnline)}`}
        />
      )}

      {/* Avatar Container */}
      <div className="avatar placeholder">
        <div
          className={`w-10 rounded-full ${color} text-neutral-content flex items-center justify-center font-bold`}
        >
          {avatarImage ? (
            <Image
              src={avatarImage}
              alt={name}
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-md">{fallbackInitials}</span>
          )}
        </div>
      </div>
    </div>
  );
}
