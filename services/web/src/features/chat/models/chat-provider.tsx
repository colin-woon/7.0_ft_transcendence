'use client';

import { createContext, useContext, ReactNode, useRef, useMemo } from 'react';
import { useStore } from 'zustand';
import { createChatStore } from './chat-store';

import type { AllChatSessions, ChatContextType, ChatSession, ChatMessage, FriendId } from './chat-types';
import type { StoreApi } from 'zustand/vanilla';
import type { ChatStore } from './chat-store';

const EMPTY_MESSAGES: ChatMessage[] = [];
const EMPTY_FRIENDIDS: FriendId[] = [];

// Context holds the store INSTANCE, not the state itself
const ChatStoreContext = createContext<StoreApi<ChatStore> | undefined>(undefined);

// The "Next.js" way to type children
interface ChatStoreProviderProps {
  children: ReactNode;         
  initialSessions?: AllChatSessions;
}

// useRef ensures the store is only created once per component lifecycle
// preventing hydration infinite loops
export const ChatStoreProvider = ({ 
  children, 
  initialSessions = {} 
}: ChatStoreProviderProps) => {
  const storeRef = useRef<StoreApi<ChatStore> | undefined>(undefined);
  
  if (!storeRef.current) {
    storeRef.current = createChatStore(initialSessions);
  }

  return (
    <ChatStoreContext.Provider value={storeRef.current}>
      {children}
    </ChatStoreContext.Provider>
  );
};

// Derived Hook for specific session logic
// useStore slices prevent unnecessary re-renders
// For your one on one chats
export const useCurrentChatSession = (): ChatSession => {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('useCurrentSession must be used within ChatStoreProvider');

  const currentChatSessionId = useStore(store, (s) => s.currentChatSessionId);
  const currentFriendIds = useStore(store, (s) => s.currentChatSessionId ? s.allChatSessions[s.currentChatSessionId].friendIds : EMPTY_FRIENDIDS);
  const messages = useStore(store, (s) => {
    if (!currentChatSessionId) return EMPTY_MESSAGES;
    return s.allChatSessions[currentChatSessionId]?.messages || EMPTY_MESSAGES;
  });

  return useMemo(() => ({
    chatId: currentChatSessionId!,
    friendIds: currentFriendIds,
    messages: messages,
  }), [currentChatSessionId, currentFriendIds, messages]);
};

// Exposes exact ChatContextType API
// For all of your friends
export const useAllChatSessions = (): ChatContextType => {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('useChat must be used within a ChatStoreProvider');

  const tempCurrentUserId = useStore(store, (s) => s.tempCurrentUserId);
  const currentChatSession = useCurrentChatSession();
  const allChatSessions = useStore(store, (s) => s.allChatSessions);
  const setChatSession = useStore(store, (s) => s.setChatSession);
  const addMessage = useStore(store, (s) => s.addMessage);

  return {
    tempCurrentUserId,
    currentChatSession,
    allChatSessions,
    setChatSession,
    addMessage,
  };
};