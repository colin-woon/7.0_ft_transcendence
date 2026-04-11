import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { AllChatSessions, FriendId, ChatMessage, ChatId, FriendList, ChatRoomType } from './chat-types';
import { getFriendList, getUserInbox, getMessageHistory, updateReadReceipt as apiUpdateReadReceipt } from '../api';
import debounce from 'lodash.debounce';

export interface ChatState {
  tempCurrentUserId: FriendId | null;
  currentChatSessionId: ChatId | null;
  allChatSessions: AllChatSessions;
  allFriendships: FriendList;
  isLoadingFriends: boolean;
  friendsError: string | null;
  typingUsers: Record<ChatId, Record<FriendId, boolean>>;
  readReceipts: Record<ChatId, Record<FriendId, number>>; // chatId -> userId -> lastReadMessageId
}

export interface ChatActions {
  setTempCurrentUserId: (userId: FriendId) => void;
  setUserStatus: (userId: FriendId, isOnline: boolean) => void;
  setChatSession: (chatId: ChatId, type: ChatRoomType, name: string | null, friendIds: FriendId[], messages: ChatMessage[] | null) => void;
  addMessage: (msg: ChatMessage) => void;
  setAllFriendships: (friendList: FriendList) => void;
  setCurrentChatSessionId: (chatId: ChatId | null) => void;
  fetchAllFriendships: (userId: FriendId) => Promise<void>;
  fetchAllChatSessions: (userId: FriendId) => Promise<void>;
  fetchChatHistory: (chatId: ChatId) => Promise<void>;
  setTypingStatus: (chatId: ChatId, senderId: FriendId) => void;
  updateReadReceipt: (chatId: ChatId, userId: FriendId, messageId: number) => void;
  sendReadReceipt: (chatId: ChatId, userId: FriendId, messageId: number) => Promise<void>;
}

export type ChatStore = ChatState & ChatActions;

// Create a singleton debounced clearer that lives outside the store state
// It takes `set` to modify the store directly, clearing the user after 3 seconds
const clearTypingStatus = debounce(
  (set: any, chatId: ChatId, senderId: FriendId) => {
    set((state: ChatState) => {
      if (state.typingUsers[chatId]?.[senderId]) {
        delete state.typingUsers[chatId][senderId];
      }
    });
  },
  3000
);

// Factory pattern: creates a new store instance per Provider
export const createChatStore = (initialSessions: AllChatSessions = {}) => {
  return createStore<ChatStore>()(
    immer((set, get) => ({
      allChatSessions: initialSessions,
      allFriendships: [],
      currentChatSessionId: null,
      tempCurrentUserId: 1, // TEMP Hardcoded on mount as requested
      isLoadingFriends: false,
      friendsError: null,
      typingUsers: {},
      readReceipts: {},

      setTempCurrentUserId: (userId: FriendId) =>
        set((state) => {
          state.tempCurrentUserId = userId;
      }),
      setUserStatus: (userId: FriendId, isOnline: boolean) =>
        set((state) => {
          // Find the actual friend object by matching the ID
          const friend = state.allFriendships.find(f => f.friendId === userId);
          
          if (friend) {
            friend.isOnline = isOnline;
          }
        }),
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
          if (state.typingUsers[msg.chatId]?.[msg.senderId]) {
            delete state.typingUsers[msg.chatId][msg.senderId];
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
      },
      setTypingStatus: (chatId: ChatId, senderId: FriendId) => {
        set((state) => {
          if (!state.typingUsers[chatId]) {
            state.typingUsers[chatId] = {};
          }
          state.typingUsers[chatId][senderId] = true;
        });
        clearTypingStatus(set, chatId, senderId);
      },
      updateReadReceipt: (chatId: ChatId, userId: FriendId, messageId: number) => {
        set((state) => {
          if (!state.readReceipts[chatId]) {
            state.readReceipts[chatId] = {};
          }
          // Enforce monotonicity: only update if new messageId is greater
          const currentMessageId = state.readReceipts[chatId][userId] || 0;
          if (messageId > currentMessageId) {
            state.readReceipts[chatId][userId] = messageId;
            // Also update the chat session's readReceipts if it exists
            if (state.allChatSessions[chatId]) {
              if (!state.allChatSessions[chatId].readReceipts) {
                state.allChatSessions[chatId].readReceipts = {};
              }
              state.allChatSessions[chatId].readReceipts![userId] = messageId;
            }
          }
        });
      },
      sendReadReceipt: async (chatId: ChatId, userId: FriendId, messageId: number) => {
        // Check monotonicity before sending
        const currentState = get();
        const currentMessageId = currentState.readReceipts[chatId]?.[userId] || 0;
        if (messageId <= currentMessageId) {
          return; // Don't send if not progressing forward
        }

        try {
          // Optimistically update local state
          set((state) => {
            if (!state.readReceipts[chatId]) {
              state.readReceipts[chatId] = {};
            }
            state.readReceipts[chatId][userId] = messageId;
            if (state.allChatSessions[chatId]) {
              if (!state.allChatSessions[chatId].readReceipts) {
                state.allChatSessions[chatId].readReceipts = {};
              }
              state.allChatSessions[chatId].readReceipts![userId] = messageId;
            }
          });

          // Send to backend
          await apiUpdateReadReceipt(chatId, userId, messageId);
        } catch (error) {
          console.error('Failed to send read receipt:', error);
          // In a production app, you might want to rollback the optimistic update here
        }
      },
    }))
  );
};

