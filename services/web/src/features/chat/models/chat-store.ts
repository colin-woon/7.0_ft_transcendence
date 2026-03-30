import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { AllSessions, FriendId, ChatMessage, ChatId } from './chat-types';

export interface ChatState {
  tempCurrentUserId: FriendId | null;
  currentChatId: ChatId | null;
  sessions: AllSessions;
}

export interface ChatActions {
  setSession: (chatId: ChatId) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
}

export type ChatStore = ChatState & ChatActions;

// Factory pattern: creates a new store instance per Provider
export const createChatStore = (initialSessions: AllSessions = {}) => {
  return createStore<ChatStore>()(
    immer((set) => ({
      sessions: initialSessions,
      currentChatId: null,
      tempCurrentUserId: 2, // TEMP Hardcoded on mount as requested

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
          state.sessions[chatId].unshift(msg);
        }),

      setMessages: (messages: ChatMessage[]) => 
        set((state) => {
          const chatId = state.currentChatId;
          if (!chatId) return;
          state.sessions[chatId] = messages; // Directly set the array
        })
    }))
  );
};

