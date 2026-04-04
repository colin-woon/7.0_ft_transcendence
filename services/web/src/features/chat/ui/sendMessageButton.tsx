'use client';

import { useState } from 'react';
import { sendMessage } from '../api/chat-services';
import { useCurrentChatSession, useChatActions } from '../models';

export function SendMessageButton() {
  const { tempCurrentUserId, chatId } = useCurrentChatSession();
  const { addMessage } = useChatActions();

  const [messageText, setMessageText] = useState('');

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

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Type a message..."
        className="input input-bordered w-full bg-accent"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
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