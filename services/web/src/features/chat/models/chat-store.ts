import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { AllSessions, FriendId, ChatMessage } from './chat-types';
import { useMemo, SetStateAction } from 'react';

export interface ChatState {
  currentUserId: FriendId | null;
  sessions: AllSessions;
}

export interface ChatActions {
  setSession: (userId: FriendId) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (updater: SetStateAction<ChatMessage[]>) => void;
}

export type ChatStore = ChatState & ChatActions;

// Factory pattern: creates a new store instance per Provider
export const createChatStore = (initialSessions: AllSessions = {}) => {
  return createStore<ChatStore>()(
    immer((set) => ({
      sessions: initialSessions,
      currentUserId: 1, // TEMP Hardcoded on mount as requested

      setSession: (userId: FriendId) => 
        set((state) => {
          state.currentUserId = userId;
        }),

      addMessage: (msg: ChatMessage) => 
        set((state) => {
          const userId = state.currentUserId;
          if (!userId) return;
          
          if (!state.sessions[userId]) {
            state.sessions[userId] = [];
          }
          state.sessions[userId].push(msg);
        }),

      setMessages: (updater: SetStateAction<ChatMessage[]>) => 
        set((state) => {
          const userId = state.currentUserId;
          if (!userId) return;

          const current = state.sessions[userId] || [];
          
          // Apply functional updater or direct array replacement
          state.sessions[userId] = typeof updater === 'function' 
            ? updater(current) 
            : updater;
        })
    }))
  );
};

