'use client';

import { createContext, useContext, ReactNode, useRef, useMemo } from 'react';
import { useStore } from 'zustand';
import { createChatStore } from './chat-store';

import type { AllSessions, ChatContextType, UserSession, ChatMessage } from './chat-types';
import type { StoreApi } from 'zustand/vanilla';
import type { ChatStore } from './chat-store';

const EMPTY_MESSAGES: ChatMessage[] = [];

// Context holds the store INSTANCE, not the state itself
const ChatStoreContext = createContext<StoreApi<ChatStore> | undefined>(undefined);

// The "Next.js" way to type children
interface ChatStoreProviderProps {
  children: ReactNode;         
  initialSessions?: AllSessions;
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
export const useCurrentChatSession = (): UserSession => {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('useCurrentSession must be used within ChatStoreProvider');

  const currentChatId = useStore(store, (s) => s.currentChatId);
  const messages = useStore(store, (s) => {
    if (!currentChatId) return EMPTY_MESSAGES;
    return s.sessions[currentChatId] || EMPTY_MESSAGES;
  });

  return useMemo(() => ({
    chatId: currentChatId,
    messages
  }), [currentChatId, messages]);
};

// Exposes exact ChatContextType API
// For all of your friends
export const useChat = (): ChatContextType => {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('useChat must be used within a ChatStoreProvider');

  const tempCurrentUserId = useStore(store, (s) => s.tempCurrentUserId);
  const session = useCurrentChatSession();
  const sessions = useStore(store, (s) => s.sessions);
  const setSession = useStore(store, (s) => s.setSession);
  const addMessage = useStore(store, (s) => s.addMessage);
  const setMessages = useStore(store, (s) => s.setMessages);

  return {
    tempCurrentUserId,
    session,
    sessions,
    setSession,
    addMessage,
    setMessages
  };
};