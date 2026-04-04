import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { AllChatSessions, FriendId, ChatMessage, ChatId, FriendList, ChatRoomType } from './chat-types';
import { getFriendList, getUserInbox, getMessageHistory } from '../api';

export interface ChatState {
  tempCurrentUserId: FriendId | null;
  currentChatSessionId: ChatId | null;
  allChatSessions: AllChatSessions;
  allFriendships: FriendList;
  isLoadingFriends: boolean;
  friendsError: string | null;
}

export interface ChatActions {
  setChatSession: (chatId: ChatId, type: ChatRoomType, name: string | null, friendIds: FriendId[], messages: ChatMessage[] | null) => void;
  addMessage: (msg: ChatMessage) => void;
  setAllFriendships: (friendList: FriendList) => void;
  setCurrentChatSessionId: (chatId: ChatId | null) => void;
  fetchAllFriendships: (userId: FriendId) => Promise<void>;
  fetchAllChatSessions: (userId: FriendId) => Promise<void>;
  fetchChatHistory: (chatId: ChatId) => Promise<void>;
}

export type ChatStore = ChatState & ChatActions;

// Factory pattern: creates a new store instance per Provider
export const createChatStore = (initialSessions: AllChatSessions = {}) => {
  return createStore<ChatStore>()(
    immer((set) => ({
      allChatSessions: initialSessions,
      allFriendships: [],
      currentChatSessionId: null,
      tempCurrentUserId: 1, // TEMP Hardcoded on mount as requested
      isLoadingFriends: false,
      friendsError: null,

      setChatSession: (chatId: ChatId, type: ChatRoomType, name: string | null, friendIds: FriendId[], messages: ChatMessage[] | null) => 
        set((state) => {
          state.currentChatSessionId = chatId;
           if (!state.allChatSessions[chatId]) {
            state.allChatSessions[chatId] = { chatId: chatId, type: type, name: name, memberIds: friendIds, messages: [] };
          }
          state.allChatSessions[chatId].messages = messages; // Directly set the array
        }),

      setCurrentChatSessionId: (chatId: ChatId | null) =>
        set((state) => {
          state.currentChatSessionId = chatId;
        }),

      addMessage: (msg: ChatMessage) => 
        set((state) => {
          const chatId = state.currentChatSessionId;
          if (!chatId) return;
          
          if (state.allChatSessions[chatId].messages) {
            state.allChatSessions[chatId].messages.unshift(msg);
          }
        }),
        
      setAllFriendships: (friendList: FriendList) =>
        set((state) => {
          state.allFriendships = friendList;
        }),

      fetchAllFriendships: async (userId: FriendId) => {
        const friendList = await getFriendList(userId);
        set((state) => {
          state.allFriendships = friendList;
        });
      },

      fetchAllChatSessions: async (userId: FriendId) => {
        try {
          const rawSessions = await getUserInbox(userId);
          set((state) => {
            const transformedSessions: AllChatSessions = {};
            rawSessions.forEach((session) => {
              transformedSessions[session.chatId] = {
                chatId: session.chatId,
                type: session.type,
                memberIds: session.memberIds,
                name: session.name || null,
                messages: [],
              };
            });
            state.allChatSessions = transformedSessions;
          });
        } catch (error) {
          console.error("Failed to fetch inbox:", error);
        }
      },
      fetchChatHistory: async (chatId: ChatId) => {
        const messages = await getMessageHistory(chatId);
        set((state) => {
          if (state.allChatSessions[chatId]) {
            state.allChatSessions[chatId].messages = messages;
          }
        });
      }
    }))
  );
};

