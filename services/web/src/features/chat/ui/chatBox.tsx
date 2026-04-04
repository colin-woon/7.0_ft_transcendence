'use client';

import { useEffect } from 'react';
import { useChatActions, useCurrentChatSession } from '../models';

export function ChatBox() {
  const { fetchChatHistory } = useChatActions();
  const { chatId, tempCurrentUserId, messages } = useCurrentChatSession();

  useEffect(() => {
    if (chatId)
      fetchChatHistory(chatId);
  }, [chatId, fetchChatHistory]);

  // 2. Get messages for the active session
  const loadedMessages = chatId ? messages || [] : [];

  if (!chatId) {
    return <div className="p-4 text-center">Select a friend to start chatting</div>;
  }

  return (
    // 3. Logic: If I sent it, move to the right. If friend sent it, stay left.
    <div className="flex flex-col-reverse h-[500px] w-full border rounded-lg p-4 overflow-y-auto">
      {loadedMessages.map((msg) => {
        const isMe = msg.senderId === tempCurrentUserId;

        return (
          <div key={msg.id} className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}>
            <div className={`chat-bubble ${isMe ? 'chat-bubble-primary' : 'chat-bubble-secondary'}`}>
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}