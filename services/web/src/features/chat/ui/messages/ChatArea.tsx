'use client';

import { useEffect, useRef } from 'react';
import { useChatActions, useCurrentChatSession, useMessageVisibility, useIsAllowedChat, useUserDisplay } from '@/features/chat/models';
import { useAuth } from '@/features/auth/models/AuthContext';
import { useRouter } from 'next/navigation';

// Step 1: Define a color array using DaisyUI chat bubble classes
const BUBBLE_COLORS = [
  'chat-bubble-secondary',
  'chat-bubble-accent',
  'chat-bubble-info',
  'chat-bubble-success',
  'chat-bubble-warning'
];

export function ChatArea() {
  const { sendReadReceipt } = useChatActions();
  const { chatId, messages, typingUsers, readReceipts } = useCurrentChatSession();
  const isAllowedChat = useIsAllowedChat(chatId);
  const { user } = useAuth();
  const currentUserId = user?.id;
  const router = useRouter();
    
  // Refs for message elements to attach Intersection Observer
  const messageRefs = useRef<Map<number | string, HTMLDivElement>>(new Map());
  const senderIds = Array.from(new Set(messages?.map(m => m.senderId) || []));
  const resolveDisplay = useUserDisplay(senderIds);

  // Use visibility tracking hook
  const { observeElement } = useMessageVisibility({
    chatId,
    userId: currentUserId || 0,
    onReadReceipt: isAllowedChat ? sendReadReceipt : async () => {},
  });

  // Observe message elements when they mount or messages change
  useEffect(() => {
    messageRefs.current.forEach((element, messageId) => {
      if (element) {
        observeElement(element);
      }
    });
  }, [messages, observeElement]);

  const loadedMessages = chatId ? messages || [] : [];

  if (!chatId) {
    return <div className="p-4 text-center">Select a friend to start chatting</div>;
  }

  const activeTypingUserIds = isAllowedChat
    ? Object.keys(typingUsers || {}).filter((userIdStr) => Number(userIdStr) !== currentUserId)
    : [];

  const firstTypingId = activeTypingUserIds[0];
  const typingDisplayName = firstTypingId 
  ? resolveDisplay(Number(firstTypingId)).displayName 
  : '';

  // Pre-calculate which message ID should display the "Read by [User]" tag for each user.
  // We only show it on the *latest* message sent by the current user that the other user has read.
  const latestReadByMessageId: Record<number, number[]> = {};
  
  if (currentUserId && isAllowedChat) {
    Object.entries(readReceipts || {}).forEach(([uid, lastReadId]) => {
      const userId = Number(uid);
      if (userId === currentUserId) return;

      let maxMsgId = -1;
      for (const msg of loadedMessages) {
        if (msg.senderId !== currentUserId) continue;
        const msgIdNum = typeof msg.id === 'number' ? msg.id : parseInt(String(msg.id), 10);
        if (msgIdNum <= lastReadId && msgIdNum > maxMsgId) {
          maxMsgId = msgIdNum;
        }
      }
      
      if (maxMsgId !== -1) {
        if (!latestReadByMessageId[maxMsgId]) {
          latestReadByMessageId[maxMsgId] = [];
        }
        latestReadByMessageId[maxMsgId].push(userId);
      }
    });
  }

  {/* Because it's flex-col-reverse, pushing items here puts them at the visual bottom! */}
  return (
    <div className="flex flex-col-reverse flex-1 min-h-0 w-full bg-base-100 p-4 overflow-y-auto">
      
      {/* TYPING INDICATOR BUBBLE */}
      {activeTypingUserIds.length > 0 && (
        <div className="chat chat-start opacity-70 mb-2">
          <div className="chat-header pb-1 text-xs">
            {activeTypingUserIds.length === 1
              ? `${typingDisplayName} is typing...`
              : `${activeTypingUserIds.length} users are typing...`}
          </div>
          <div className="chat-bubble flex items-center h-10 px-4">
            <span className="loading loading-dots loading-md" />
          </div>
        </div>
      )}

      {/* CHAT MESSAGES */}
      {loadedMessages.map((msg) => {
        const isMe = msg.senderId === currentUserId;
        const { displayName } = resolveDisplay(msg.senderId);

        // Step 2: Assign a consistent color using modulo on the senderId
        const colorClass = isMe 
          ? 'chat-bubble-primary' 
          : BUBBLE_COLORS[Number(msg.senderId) % BUBBLE_COLORS.length];

        // Get read receipt info for this message
        const messageIdNum = typeof msg.id === 'number' ? msg.id : parseInt(String(msg.id), 10);
        const usersWhoRead = latestReadByMessageId[messageIdNum] || [];

        return (
          <div 
            data-message-id={msg.id}
            key={msg.id} 
            className={`chat ${isMe ? 'chat-end' : 'chat-start'}`}
            ref={(el) => {
              if (el) {
                messageRefs.current.set(msg.id, el);
              } else {
                messageRefs.current.delete(msg.id);
              }
            }}
          >
            {/* Step 3: Add the chat-header for sender label if it's not the current user */}
            {!isMe && (
              <div className="chat-header pb-1 text-xs opacity-70 hover:underline cursor-pointer" onClick={() => router.push(`/users/${msg.senderId}`)}>
                {displayName}
              </div>
            )}
            <div className={`chat-bubble break-words max-w-[85%] md:max-w-[70%] ${colorClass}`}>
              {msg.content}
            </div>
            {/* Read receipt indicator */}
            {isMe && usersWhoRead.length > 0 && (
              <div className="chat-footer opacity-50 text-xs mt-1">
                ✓ Read by {usersWhoRead.length === 1 
                  ? `${resolveDisplay(usersWhoRead[0]).displayName}` 
                  : `${usersWhoRead.length} users`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}