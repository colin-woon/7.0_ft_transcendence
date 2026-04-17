'use client';

import type { StoreApi } from 'zustand/vanilla';
import type { ChatStore } from './chat-store';
import type { AllChatSessions } from './chat-types';
import { createContext, ReactNode, useRef, useEffect } from 'react';
import { createChatStore } from './chat-store';
import { useAuth } from '@/features/auth/models/AuthContext';


// Context holds the store INSTANCE, not the state itself
export const ChatStoreContext = createContext<StoreApi<ChatStore> | undefined>(undefined);

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
  const { user } = useAuth();
  
  if (!storeRef.current) {
    storeRef.current = createChatStore(initialSessions);
  }

  useEffect(() => {
    if (user?.id && storeRef.current) {
      storeRef.current.getState().fetchAllAcceptedFriends();
    }
  }, [user?.id]);

  return (
    <ChatStoreContext.Provider value={storeRef.current}>
      {children}
    </ChatStoreContext.Provider>
  );
};
