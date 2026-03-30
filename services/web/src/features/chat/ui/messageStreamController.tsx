'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '../models';
import { getMessageStream } from '../api/chat-services';

export function MessageStreamController() {
  const { session, tempCurrentUserId, addMessage } = useChat();

  useEffect(() => {
    // Only open a stream if we have an active chat and user
    if (!session.chatId || !tempCurrentUserId) return;

    // TEMPORARY LOGIC: We assume the current chat context defines the participants. 
    // You should properly extract the `recipientId` from your context or JWT
    // when you have real user objects.
    const mockRecipientId = tempCurrentUserId === 2 ? 1 : 2; 

    // Open the SSE connection
    const eventSource = getMessageStream(tempCurrentUserId, (eventContent) => {
      addMessage({
        id: "msg-" + tempCurrentUserId + '-' + Date.now(),
        chatId: session.chatId!,
        senderId: mockRecipientId,     
        recipientId: tempCurrentUserId, 
        content: eventContent,
        createdAt: new Date().toISOString() // Or grab from backend payload if available
      });
    });

    // 3. Cleanup: Close connection when navigating away or changing chats
    return () => {
      if (eventSource && typeof eventSource.close === 'function') {
        eventSource.close();
      }
    };
  }, [session.chatId, tempCurrentUserId, addMessage]);

  // Headless: Handles logic, renders no UI
  return null; 
}