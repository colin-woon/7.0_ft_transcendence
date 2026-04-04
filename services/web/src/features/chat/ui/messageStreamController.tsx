'use client';

import { useEffect } from 'react';
import { useCurrentChatSession, useChatActions } from '../models';
import { getMessageStream } from '../api/chat-services';

export function MessageStreamController() {
  const { addMessage } = useChatActions();
  const { tempCurrentUserId, chatId } = useCurrentChatSession();

  useEffect(() => {
    if (!chatId || !tempCurrentUserId) return;
    
    const eventSource = getMessageStream(tempCurrentUserId, (eventContent) => {
      if (eventContent.type === 'NEW_MESSAGE' && eventContent.payload.chatId === chatId) {
      const chatUserId = tempCurrentUserId === 1 ? eventContent.payload.senderId : 1;
      addMessage({
        id: eventContent.payload.id,
        chatId: chatId!,
        senderId: chatUserId,     
        content: eventContent.payload.content,
        createdAt: eventContent.payload.createdAt
      });
    }});

    // 3. Cleanup: Close connection when navigating away or changing chats
    return () => {
      if (eventSource && typeof eventSource.close === 'function') {
        eventSource.close();
      }
    };
  }, [chatId, tempCurrentUserId, addMessage]);

  // Headless: Handles logic, renders no UI
  return null; 
}