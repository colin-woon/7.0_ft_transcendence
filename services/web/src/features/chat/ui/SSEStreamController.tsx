'use client';

import { useEffect } from 'react';
import { useCurrentChatSession, useChatActions } from '@/features/chat/models';
import { getMessageStream } from '@/features/chat/api';

export function SSEStreamController() {
  const { addMessage, setTypingStatus, updateReadReceipt, setUserStatus } = useChatActions();
  const { currentUserId, chatId } = useCurrentChatSession();

  useEffect(() => {
    if (!currentUserId) return;
    
    const eventSource = getMessageStream((eventContent) => {
      if (eventContent.type === 'NEW_MESSAGE' && eventContent.payload.chatId === chatId) {
        addMessage({
          id: eventContent.payload.id,
          chatId: chatId!,
          senderId: eventContent.payload.senderId,
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
  }, [chatId, currentUserId, addMessage, updateReadReceipt]);

  // Headless: Handles logic, renders no UI
  return null; 
}