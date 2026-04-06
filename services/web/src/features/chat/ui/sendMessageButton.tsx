'use client';

import { useState, useRef } from 'react';
import { sendMessage, sendTypingEvent } from '../api/chat-services';
import { useCurrentChatSession, useChatActions } from '../models';

export function SendMessageButton() {
  const { tempCurrentUserId, chatId } = useCurrentChatSession();
  const { addMessage } = useChatActions();

  const [messageText, setMessageText] = useState('');
  
  // Track the last timestamp we fired a typing event to throttle API calls
  const lastTypingTime = useRef<number>(0);

  const handleSend = () => {
    if (messageText.trim() && chatId && tempCurrentUserId) {
      sendMessage(
        chatId,
        tempCurrentUserId,
        { content: messageText }
      );
      setMessageText('');
      addMessage({
        id: "msg-" + tempCurrentUserId + '-' + Date.now(),
        chatId: chatId,
        senderId: tempCurrentUserId,
        content: messageText,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);

    // Only broadcast typing if we have a chat session, current user, and the user hasn't cleared the input
    if (chatId && tempCurrentUserId && e.target.value.trim().length > 0) {
      const now = Date.now();
      // Throttle: Max 1 outbound request every 3 seconds (3000ms)
      if (now - lastTypingTime.current > 3000) {
        sendTypingEvent(chatId, tempCurrentUserId).catch((err) => {
          console.error('Failed to send typing event', err);
        });
        lastTypingTime.current = now; // Update the timestamp
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Type a message..."
        className="input input-bordered w-full bg-accent"
        value={messageText}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSend();
          }
        }}
      />
      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={!messageText.trim() || !chatId}
      >
        Send Message
      </button>
    </div>
  );
}