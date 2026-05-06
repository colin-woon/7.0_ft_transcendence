'use client';

import type { StoreApi } from 'zustand/vanilla';
import type { ChatStore, UserDisplayStore } from './chat-store';
import type { AllChatSessions } from './chat-types';
import { createContext, ReactNode, useRef, useEffect } from 'react';
import { createChatStore, createUserDisplayStore } from './chat-store';
import { useAuth } from '@/features/auth/models/AuthContext';

export const ChatStoreContext = createContext<StoreApi<ChatStore> | undefined>(undefined);
export const UserDisplayStoreContext = createContext<StoreApi<UserDisplayStore> | undefined>(undefined);

interface ChatStoreProviderProps {
  children: ReactNode;         
  initialSessions?: AllChatSessions;
}

export const ChatStoreProvider = ({ 
  children, 
  initialSessions = {} 
}: ChatStoreProviderProps) => {
  const storeRef = useRef<StoreApi<ChatStore> | undefined>(undefined);
  const { user } = useAuth();
  const userDisplayStoreRef = useRef<StoreApi<UserDisplayStore> | undefined>(undefined);

  if (!userDisplayStoreRef.current) {
    userDisplayStoreRef.current = createUserDisplayStore();
  }
  
  if (!storeRef.current) {
    storeRef.current = createChatStore(initialSessions);
  }

  useEffect(() => {
    if (user?.id && storeRef.current) {
      const store = storeRef.current.getState();
      
      Promise.all([
        store.fetchAllAcceptedFriends(),
        store.fetchAllChatSessions(),
        store.fetchAllFriendshipStatuses()
      ]).catch((error) => {
        console.error("Failed to initialize chat store data:", error);
      });
    }
  }, [user?.id]);

  return (
    <ChatStoreContext.Provider value={storeRef.current}>
      <UserDisplayStoreContext.Provider value={userDisplayStoreRef.current}>
        {children}
      </UserDisplayStoreContext.Provider>
    </ChatStoreContext.Provider>
  );
};
