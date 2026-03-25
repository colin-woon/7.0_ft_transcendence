import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { AllSessions, FriendId, ChatMessage, ChatId } from './chat-types';
import { useMemo, SetStateAction } from 'react';

export interface ChatState {
  tempCurrentUserId: FriendId | null;
  currentChatId: ChatId | null;
  sessions: AllSessions;
}

export interface ChatActions {
  setSession: (chatId: ChatId) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (updater: SetStateAction<ChatMessage[]>) => void;
}

export type ChatStore = ChatState & ChatActions;

// Factory pattern: creates a new store instance per Provider
export const createChatStore = (initialSessions: AllSessions = {}) => {
  return createStore<ChatStore>()(
    immer((set) => ({
      sessions: initialSessions,
      currentChatId: null,
      tempCurrentUserId: 1, // TEMP Hardcoded on mount as requested

      setSession: (chatId: ChatId) => 
        set((state) => {
          state.currentChatId = chatId;
        }),

      addMessage: (msg: ChatMessage) => 
        set((state) => {
          const chatId = state.currentChatId;
          if (!chatId) return;
          
          if (!state.sessions[chatId]) {
            state.sessions[chatId] = [];
          }
          state.sessions[chatId].push(msg);
        }),

      setMessages: (updater: SetStateAction<ChatMessage[]>) => 
        set((state) => {
          const chatId = state.currentChatId;
          if (!chatId) return;

          const current = state.sessions[chatId] || [];
          
          // Apply functional updater or direct array replacement
          state.sessions[chatId] = typeof updater === 'function' 
            ? updater(current) 
            : updater;
        })
    }))
  );
};

