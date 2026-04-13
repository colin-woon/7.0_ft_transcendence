'use client';

import { useState, useRef } from 'react';
import { sendMessage, sendTypingEvent } from '../../api/chat-services';
import { useCurrentChatSession, useChatActions } from '../../models';

export function MessageInput() {
  const { currentUserId, chatId } = useCurrentChatSession();
  const { addMessage } = useChatActions();

  const [messageText, setMessageText] = useState('');
  
  // Track the last timestamp we fired a typing event to throttle API calls
  const lastTypingTime = useRef<number>(0);

  const handleSend = () => {
    if (messageText.trim() && chatId && currentUserId) {
      sendMessage(
        chatId,
        { content: messageText }
      );
      setMessageText('');
      addMessage({
        id: "msg-" + currentUserId + '-' + Date.now(),
        chatId: chatId,
        senderId: currentUserId,
        content: messageText,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    // Only broadcast typing if we have a chat session, current user, and the user hasn't cleared the input
    if (chatId && currentUserId && e.target.value.trim().length > 0) {
      const now = Date.now();
      // Throttle: Max 1 outbound request every 3 seconds (3000ms)
      if (now - lastTypingTime.current > 3000) {
        sendTypingEvent(chatId).catch((err) => {
          console.error('Failed to send typing event', err);
        });
        lastTypingTime.current = now; // Update the timestamp
      }
    }
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-base-200/50 border-t border-base-300 w-full shrink-0">
      <input
        type="text"
        placeholder="Type a message..."
        className="input input-bordered flex-1 rounded-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        value={messageText}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSend();
          }
        }}
      />
      <button
        className="btn btn-primary btn-circle shrink-0 transition-transform active:scale-95"
        onClick={handleSend}
        disabled={!messageText.trim() || !chatId}
        aria-label="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
          <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
        </svg>
      </button>
    </div>
  );
}