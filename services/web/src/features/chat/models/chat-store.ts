import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { AllChatSessions, FriendId, ChatMessage, ChatId, FriendList, ChatRoomType, PendingFriendRequest, FriendStatus } from './chat-types';
import { getFriendList, getUserInbox, getMessageHistory, updateReadReceipt as apiUpdateReadReceipt, getPendingFriendRequests, getAllFriendshipStatuses } from '../api';
import debounce from 'lodash.debounce';

export interface ChatState {
  currentChatSessionId: ChatId | null;
  allChatSessions: AllChatSessions;
  allAcceptedFriends: FriendList;
  pendingRequests: PendingFriendRequest[];
  isLoadingChatHistory: boolean
  isLoadingFriends: boolean;
  friendsError: string | null;
  allFriendshipStatuses: Record<FriendId, { status: FriendStatus, lastActionUserId: FriendId }>;
  typingUsers: Record<ChatId, Record<FriendId, boolean>>;
  readReceipts: Record<ChatId, Record<FriendId, number>>; // chatId -> userId -> lastReadMessageId
}

export interface ChatActions {
  setUserStatus: (userId: FriendId, isOnline: boolean) => void;
  setChatSession: (chatId: ChatId, type: ChatRoomType, name: string | null, friendIds: FriendId[], messages: ChatMessage[] | null, isAllowedChat: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  setAllAcceptedFriends: (friendList: FriendList) => void;
  setCurrentChatSessionId: (chatId: ChatId | null) => void;
  fetchAllAcceptedFriends: () => Promise<void>;
  fetchPendingFriendships: () => Promise<void>;
  fetchAllChatSessions: () => Promise<void>;
  setFriendshipStatus: (friendId: FriendId, status: FriendStatus, lastActionUserId: FriendId) => void;
  fetchAllFriendshipStatuses: () => Promise<void>;
  fetchChatHistory: (chatId: ChatId) => Promise<void>;
  setTypingStatus: (chatId: ChatId, senderId: FriendId) => void;
  updateReadReceipt: (chatId: ChatId, userId: FriendId, messageId: number) => void;
  sendReadReceipt: (chatId: ChatId, userId: FriendId, messageId: number) => Promise<void>;
  updateChatPermission: (chatId: string | null, allowed: boolean) => void;
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
      allAcceptedFriends: [],
      pendingRequests: [],
      currentChatSessionId: null,
      isLoadingChatHistory: true,
      isLoadingFriends: false,
      friendsError: null,
      typingUsers: {},
      readReceipts: {},
      allFriendshipStatuses: {},

      setUserStatus: (userId: FriendId, isOnline: boolean) =>
        set((state) => {
          // Find the actual friend object by matching the ID
          const friend = state.allAcceptedFriends.find(f => f.friendId === userId);
          
          if (friend) {
            friend.isOnline = isOnline;
          }
        }),
      setChatSession: (chatId: ChatId, type: ChatRoomType, name: string | null, friendIds: FriendId[], messages: ChatMessage[] | null, isAllowedChat: boolean = false, requestedBy?: FriendId, friendshipStatus?: FriendStatus) => 
        set((state) => {  
          state.currentChatSessionId = chatId;
           if (!state.allChatSessions[chatId]) {
            state.allChatSessions[chatId] = { chatId: chatId, type: type, name: name, memberIds: friendIds, messages: [], isAllowedChat: isAllowedChat, requestedBy, friendshipStatus };
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
          
          const session = state.allChatSessions[chatId];
          if (!session.messages) return;

          // Deduplicate: check if message ID already exists
          const exists = session.messages.some(m => m.id === msg.id);
          if (exists) return;

          session.messages.unshift(msg);

          if (state.typingUsers[msg.chatId]?.[msg.senderId]) {
            delete state.typingUsers[msg.chatId][msg.senderId];
          }
        }),
        
      setAllAcceptedFriends: (friendList: FriendList) =>
        set((state) => {
          state.allAcceptedFriends = friendList;
      }),

      setFriendshipStatus: (friendId: FriendId, status: FriendStatus, lastActionUserId: FriendId) =>
        set((state) => {
          state.allFriendshipStatuses[friendId] = { status, lastActionUserId };
      }),

      fetchAllAcceptedFriends: async () => {
        const friendList = await getFriendList();
        set((state) => {
          state.allAcceptedFriends = friendList;
        });
      },

      fetchPendingFriendships: async () => {
        const pending = await getPendingFriendRequests();
        set((state) => {
          state.pendingRequests = pending;
        });
      },

      fetchAllFriendshipStatuses: async () => {
      const friendshipStatusesRaw = await getAllFriendshipStatuses();
      const statusRecords: Record<FriendId, { status: FriendStatus, lastActionUserId: FriendId }> = {};

      friendshipStatusesRaw.forEach((item) => {
        statusRecords[item.userId] = { status: item.status, lastActionUserId: item.lastActionUserId };
      });

      set((state) => {
        state.allFriendshipStatuses = statusRecords;
      });
      },

      fetchAllChatSessions: async () => {
        try {
          const rawSessions = await getUserInbox();
          set((state) => {
            const transformedSessions: AllChatSessions = {};
            rawSessions.forEach((session) => {
              const existingMessages = state.allChatSessions[session.chatId]?.messages || [];
              transformedSessions[session.chatId] = {
                chatId: session.chatId,
                type: session.type,
                memberIds: session.memberIds,
                name: session.name || null,
                isAllowedChat: session.isAllowedChat || false,
                messages: existingMessages,
                readReceipts: {},
                requestedBy: session.requestedBy,
                friendshipStatus: session.friendshipStatus,
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
          state.isLoadingChatHistory = false;
          if (!state.allChatSessions[chatId]) {
            state.allChatSessions[chatId] = {
              chatId: chatId,
              type: 'direct',
              memberIds: [],
              messages: [],
              name: null,
              isAllowedChat: false,
              readReceipts: {},
            };
          }
          state.allChatSessions[chatId].messages = messages;
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
          await apiUpdateReadReceipt(chatId, messageId);
        } catch (error) {
          console.error('Failed to send read receipt:', error);
          // In a production app, you might want to rollback the optimistic update here
        }
      },

      updateChatPermission: (chatId: string | null, allowed: boolean) => {
        set((state) => {
          if (chatId) {
            state.allChatSessions[chatId].isAllowedChat = allowed;
          }
        });
      }
    }))
  );
};

