'use client';

import { useEffect, useRef } from 'react';
import { useAllChatSessions } from '../models';
import { getMessageStream } from '../api/chat-services';

export function MessageStreamController() {
  const { currentChatSession, tempCurrentUserId, addMessage } = useAllChatSessions();

  useEffect(() => {
    if (!currentChatSession.chatId || !tempCurrentUserId) return;
    const mockRecipientId = tempCurrentUserId === 1 ? 2 : 1;

    const eventSource = getMessageStream(tempCurrentUserId, (eventContent) => {
      if (eventContent.type === 'NEW_MESSAGE' && eventContent.payload.chatId === currentChatSession.chatId) {
      addMessage({
        id: eventContent.payload.id,
        chatId: currentChatSession.chatId!,
        senderId: mockRecipientId,     
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
  }, [currentChatSession.chatId, tempCurrentUserId, addMessage]);

  // Headless: Handles logic, renders no UI
  return null; 
}