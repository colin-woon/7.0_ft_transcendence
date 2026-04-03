import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { AllChatSessions, FriendId, ChatMessage, ChatId, ChatSession } from './chat-types';

export interface ChatState {
  tempCurrentUserId: FriendId | null;
  currentChatSessionId: ChatId | null;
  allChatSessions: AllChatSessions;
}

export interface ChatActions {
  setChatSession: (chatId: ChatId, friendIds: FriendId[], messages: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
}

export type ChatStore = ChatState & ChatActions;

// Factory pattern: creates a new store instance per Provider
export const createChatStore = (initialSessions: AllChatSessions = {}) => {
  return createStore<ChatStore>()(
    immer((set) => ({
      allChatSessions: initialSessions,
      currentChatSessionId: null,
      tempCurrentUserId: 1, // TEMP Hardcoded on mount as requested

      setChatSession: (chatId: ChatId, friendIds: FriendId[], messages: ChatMessage[]) => 
        set((state) => {
          state.currentChatSessionId = chatId;
           if (!state.allChatSessions[chatId]) {
            state.allChatSessions[chatId] = { chatId: chatId, friendIds: friendIds, messages: [] };
          }
          state.allChatSessions[chatId].messages = messages; // Directly set the array
        }),

      addMessage: (msg: ChatMessage) => 
        set((state) => {
          const chatId = state.currentChatSessionId;
          if (!chatId) return;
          
          state.allChatSessions[chatId].messages.unshift(msg);
        }),
    }))
  );
};

