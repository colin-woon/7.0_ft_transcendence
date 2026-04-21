"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  BUBBLE_COLORS,
  useAllChatSessions,
  useChatActions,
  useUserDisplay,
} from "@/features/chat/models";

import { AvatarWithStatus, CreateGroupChatButton } from "@/features/chat/ui";

export function ChatSidebar() {
  const pathname = usePathname();
  const { fetchAllChatSessions } = useChatActions();
  const { allChatSessions, currentUserId } = useAllChatSessions();
  const allUserIds = Object.values(allChatSessions || {}).flatMap((chat) =>
    chat.type === "direct"
      ? chat.memberIds.filter((id) => id !== currentUserId)
      : [],
  );
  const resolveUserDisplay = useUserDisplay(allUserIds);

  useEffect(() => {
    if (currentUserId) {
      fetchAllChatSessions();
    }
  }, [fetchAllChatSessions, currentUserId]);

  return (
    <div className="flex flex-col h-full bg-base-200 text-base-content w-full">
      {/* Top Nav (Friends, Create Group) */}
      <div className="px-2 pt-2 pb-4">
        <ul className="menu menu-sm w-full p-0 gap-1">
          <li>
            <Link
              href="/friends"
              className={`flex items-center gap-3 py-3 rounded-md ${pathname === "/friends" ? "bg-base-300 text font-semibold" : "text-base-content/80 hover:bg-base-300/50"}`}
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
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              Friends
            </Link>
          </li>
          <li>
            <CreateGroupChatButton />
          </li>
        </ul>
      </div>

      {/* DM List Divider */}
      <div className="px-4 pb-2 flex justify-between items-center group">
        <span className="text-xs font-bold text-base-content/50 uppercase tracking-widest transition-colors cursor-default">
          Direct Messages
        </span>
      </div>

      {/* Scrollable Chat List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-1 custom-scrollbar">
        {Object.values(allChatSessions || {}).map((chat) => {
          const isActive = pathname === `/messages/${chat.chatId}`;

          let displayName = chat.name || "Group Chat";
          let initials = "GC";
          let displayUserId = 0; // Default logic fallback
          let avatarImage: string | null = null;

          if (chat.type === "direct") {
            const otherUserIds = chat.memberIds.filter(
              (id) => id !== currentUserId,
            );
            const otherUserId =
              otherUserIds.length > 0 ? otherUserIds[0] : currentUserId;
            displayUserId = typeof otherUserId === "number" ? otherUserId : 0;

            const resolved = resolveUserDisplay(displayUserId);
            displayName = resolved.displayName;
            avatarImage = resolved.avatarImage;
            initials = displayName.substring(0, 2).toUpperCase();
          } else if (chat.name) {
            initials = chat.name.substring(0, 2).toUpperCase();
          }

          const color = BUBBLE_COLORS[displayUserId % BUBBLE_COLORS.length];
          const unreadCount = 0;

          return (
            <Link
              key={chat.chatId}
              href={`/messages/${chat.chatId}`}
              className={`flex items-center gap-3 px-2 py-2 w-full rounded-md group transition-colors ${
                isActive
                  ? "bg-base-300 text-base-content"
                  : "hover:bg-base-300/50 text-base-content/70"
              }`}
            >
              {/* Avatar with unread/online indicator */}
              <AvatarWithStatus
                userId={displayUserId}
                chatId={chat.chatId}
                name={displayName}
                initials={initials}
                color={color}
                avatarImage={avatarImage}
                isGroup={chat.type === "group"}
              />

              {/* Chat Name */}
              <div className="flex-1 truncate">
                <span
                  className={`text-sm truncate block ${isActive || unreadCount > 0 ? "font-bold" : "font-medium"}`}
                >
                  {displayName}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
