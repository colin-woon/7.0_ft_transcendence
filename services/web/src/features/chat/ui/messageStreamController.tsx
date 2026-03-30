'use client';

import { useEffect } from 'react';
import { useChat } from '../models';
import { getMessageStream } from '../api/chat-services';

export function MessageStreamController() {
  const { session, tempCurrentUserId, addMessage } = useChat();

  useEffect(() => {
    // Only open a stream if we have an active chat and user
    if (!session.chatId || !tempCurrentUserId) return;

    // 1. Open the SSE connection
    // Pass a callback that the API layer will fire when a message arrives
    // 2. Pipe the new message directly into Zustand
    const eventSource = getMessageStream(tempCurrentUserId, (newMessage) => {
      addMessage(newMessage); 
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