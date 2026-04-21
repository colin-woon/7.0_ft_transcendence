'use client';

import { useState, useRef } from 'react';
import { sendMessage, sendTypingEvent, acceptMessageRequest } from '@/features/chat/api';
import { useCurrentChatSession, useChatActions } from '@/features/chat/models';
import { SendHorizontal } from 'lucide-react'

export function MessageInput() {
  const { currentUserId, chatId, isAllowedChat, requestedBy, friendshipStatus } = useCurrentChatSession();
  const { addMessage, updateChatPermission } = useChatActions();
  
  const lastTypingTime = useRef<number>(0);
  const [messageText, setMessageText] = useState('');

  // 1. Consolidated booleans for cleaner JSX
  const isMessageRequest = !isAllowedChat && friendshipStatus === 'requested';
  const isReceiver = isMessageRequest && requestedBy !== currentUserId;
  const isSender = isMessageRequest && requestedBy === currentUserId;

  const handleAcceptRequest = async () => {
    // 2. Use the highly accurate requestedBy from your database
    if (!requestedBy || !chatId) return; 
    
    updateChatPermission(chatId, true);
    try {
      await acceptMessageRequest(requestedBy); 
    } catch (err) {
      console.error('Failed to accept message request', err);
      updateChatPermission(chatId, false);
    }
    // Removed empty finally block
  };

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

    if (isAllowedChat && chatId && currentUserId && e.target.value.trim().length > 0) {
      const now = Date.now();
      if (now - lastTypingTime.current > 3000) {
        sendTypingEvent(chatId).catch((err) => {
          console.error('Failed to send typing event', err);
        });
        lastTypingTime.current = now; 
      }
    }
  };

  // --- RENDER LOGIC ---

  if (isReceiver) {
    return (
      <div className="w-full shrink-0 bg-base-200/50 p-3">
        <div className="alert bg-base-100 border-2 shadow-xl flex items-center justify-center gap-3">
          <span className="text-sm sm:text-base">
            This user is trying to message you. Start chatting?
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleAcceptRequest}
          >
            Accept
          </button>
        </div>
      </div>
    );
  }
  
  if (isSender) {
    return (
      <div className="w-full shrink-0 bg-base-200/50 p-3">
        <div className="alert bg-base-100 border-2 shadow-xl flex items-center justify-center gap-3">
          <span className="text-sm sm:text-base">
            Please wait for the other user to accept your message request...
          </span>
        </div>
      </div>
    );
  }

  // Standard chat input (only reaches here if isAllowedChat === true)
  return (
    <div className="flex items-center gap-3 p-4 bg-base-200/50 border-t border-base-300 w-full shrink-0"> 
      <input 
        type="text" 
        placeholder="Type a message..." 
        className="input input-bordered flex-1 rounded-full bg-base-100 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
        value={messageText} 
        onChange={handleChange} 
        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} 
      /> 
      <button 
        className="btn btn-primary btn-circle shrink-0 transition-transform active:scale-95" 
        onClick={handleSend} 
        disabled={!messageText.trim() || !chatId} 
        aria-label="Send message" 
      > 
        <SendHorizontal className="w-5 h-5" />
      </button> 
    </div>
  );
}