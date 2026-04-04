'use client';

import { useEffect } from 'react';
import { useChatActions, useCurrentChatSession } from '../models';

// Step 1: Define a color array using DaisyUI chat bubble classes
const BUBBLE_COLORS = [
  'chat-bubble-secondary',
  'chat-bubble-accent',
  'chat-bubble-info',
  'chat-bubble-success',
  'chat-bubble-warning'
];

export function ChatBox() {
  const { fetchChatHistory } = useChatActions();
  const { chatId, tempCurrentUserId, messages } = useCurrentChatSession();

  useEffect(() => {
    if (chatId)
      fetchChatHistory(chatId);
  }, [chatId, fetchChatHistory]);

  const loadedMessages = chatId ? messages || [] : [];

  if (!chatId) {
    return <div className="p-4 text-center">Select a friend to start chatting</div>;
  }

  return (
    <div className="flex flex-col-reverse h-[500px] w-full border rounded-lg p-4 overflow-y-auto">
      {loadedMessages.map((msg) => {
        const isMe = msg.senderId === tempCurrentUserId;

        // Step 2: Assign a consistent color using modulo on the senderId
        const colorClass = isMe 
          ? 'chat-bubble-primary' 
          : BUBBLE_COLORS[Number(msg.senderId) % BUBBLE_COLORS.length];

        return (
          <div key={msg.id} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
            {/* Step 3: Add the chat-header for sender label if it's not the current user */}
            {!isMe && (
              <div className="chat-header pb-1 text-xs opacity-70">
                User #{msg.senderId}
              </div>
            )}
            <div className={`chat-bubble ${colorClass}`}>
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}