"use client";

import React, { useEffect } from "react";
import {
  useAllChatSessions,
  useChatActions,
  useCurrentChatSession,
} from "../models";

export function ChatInbox() {
  const { fetchAllChatSessions, setCurrentChatSessionId } = useChatActions();
  const { allChatSessions, tempCurrentUserId } = useAllChatSessions();
  const { chatId: activeChatId } = useCurrentChatSession();

  useEffect(() => {
    // Fetch all sessions when the component mounts
    fetchAllChatSessions(tempCurrentUserId!);
  }, [fetchAllChatSessions, tempCurrentUserId]);

  useEffect(() => {
    // Auto-select the first chat if none is selected and chats are available
    if (!activeChatId && allChatSessions) {
      const firstChatId = Object.keys(allChatSessions)[0];
      if (firstChatId) {
        setCurrentChatSessionId(firstChatId);
      }
    }
  }, [allChatSessions, activeChatId, setCurrentChatSessionId]);

  return (
    <div className="flex flex-col h-full w-64 bg-base-200 border-r border-base-300 overflow-y-auto">
      {/* Header */}
      <div className="bg-accent p-4 border-b border-base-300 sticky top-0 z-10 font-bold text-lg">
        Direct Messages
      </div>

      {/* Chat List */}
      <ul className="list bg-primary w-full p-2 gap-1 rounded-box">
        {Object.values(allChatSessions || {}).map((chat) => {
          // Default display name
          let displayName = chat.name || "Unknown Chat";

          // If direct message, find the other user's ID
          if (chat.type === "direct") {
            const otherUserIds = chat.memberIds.filter(
              (id) => id !== tempCurrentUserId
            );
            // Temporarily use the other userId as the username
            displayName =
              otherUserIds.length > 0 ? `User ${otherUserIds[0]}` : "You";
          }

          // Determine if this item is currently active
          const isActive = activeChatId === chat.chatId;

          return (
            <li
              key={chat.chatId}
              className={`list-row items-center cursor-pointer transition-colors ${
                isActive ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => setCurrentChatSessionId(chat.chatId)}
            >
              {/* Avatar Placeholder */}
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                  <span className="text-sm uppercase">
                    {displayName.substring(0, 2)}
                  </span>
                </div>
              </div>

              {/* Chat Name (No message preview!) */}
              <div className="list-col-grow">
                <div className="font-semibold text-sm truncate opacity-90">
                  {displayName}
                </div>
              </div>
            </li>
          );
        })}

        {/* Empty State */}
        {Object.keys(allChatSessions || {}).length === 0 && (
          <li className="list-row justify-center opacity-50 p-4">
            No active chats
          </li>
        )}
      </ul>
    </div>
  );
}