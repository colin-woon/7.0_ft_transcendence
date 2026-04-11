'use client';

import { useEffect } from 'react';
import { useCurrentChatSession, useChatActions } from '../models';
import { getMessageStream } from '../api/chat-services';

export function SSEStreamController() {
  const { addMessage, setTypingStatus, updateReadReceipt, setUserStatus } = useChatActions();
  const { tempCurrentUserId, chatId } = useCurrentChatSession();

  useEffect(() => {
    if (!tempCurrentUserId) return;
    
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
      }
      else if (eventContent.type === 'USER_TYPING' && eventContent.payload.chatId === chatId) {
        setTypingStatus(eventContent.payload.chatId, eventContent.payload.senderId)
      }
      else if (eventContent.type === 'USER_READ' && eventContent.payload.chatId === chatId) {
        updateReadReceipt(eventContent.payload.chatId, eventContent.payload.userId, eventContent.payload.messageId);
      }
      else if (eventContent.type === 'USER_STATUS') {
        setUserStatus(eventContent.payload.userId, eventContent.payload.isOnline);
      }
  });

    // 3. Cleanup: Close connection when navigating away or changing chats
    return () => {
      if (eventSource && typeof eventSource.close === 'function') {
        eventSource.close();
      }
    };
  }, [chatId, tempCurrentUserId, addMessage, updateReadReceipt]);

  // Headless: Handles logic, renders no UI
  return null; 
}