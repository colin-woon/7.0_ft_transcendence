'use client';

import { useEffect } from 'react';
import { getMessageHistory } from '../api/chat-services';
import { useAllChatSessions, useCurrentChatSession } from '../models';

export function ChatBox() {
  const { setChatSession, addMessage, currentChatSession, tempCurrentUserId } = useAllChatSessions();

  // 1. Fetch history whenever the chatId changes
  // Update the specific session in our Zustand store
  useEffect(() => {
    const fetchHistory = async () => {
      if (currentChatSession.chatId) {
        try {
          const history = await getMessageHistory(currentChatSession.chatId);
          setChatSession(currentChatSession.chatId, currentChatSession.friendIds, history);
        } catch (error) {
          console.error("Failed to load chat history:", error);
        }
      }
    };

    fetchHistory();
  }, [currentChatSession.chatId, setChatSession]);

  // 2. Get messages for the active session
  const messages = currentChatSession.chatId ? currentChatSession.messages || [] : [];

  if (!currentChatSession.chatId) {
    return <div className="p-4 text-center">Select a friend to start chatting</div>;
  }

  return (
    // 3. Logic: If I sent it, move to the right. If friend sent it, stay left.
    <div className="flex flex-col-reverse h-[500px] w-full border rounded-lg p-4 overflow-y-auto">
      {messages.map((msg) => {
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