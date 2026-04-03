'use client';

import { useEffect, useState } from 'react';
import { getFriendList, sendMessage } from '../api/chat-services';
import { useAllChatSessions } from '../models';

export function SendMessageButton() {
  const { tempCurrentUserId, currentChatSession, addMessage } = useAllChatSessions();

  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (messageText.trim() && currentChatSession.chatId && tempCurrentUserId) {
      sendMessage(
        currentChatSession.chatId,
        tempCurrentUserId,
        { content: messageText }
      );
      setMessageText('');
      addMessage({
        id: "msg-" + tempCurrentUserId + '-' + Date.now(),
        chatId: currentChatSession.chatId,
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
        disabled={!messageText.trim() || !currentChatSession.chatId}
      >
        Send Message
      </button>
    </div>
  );
}