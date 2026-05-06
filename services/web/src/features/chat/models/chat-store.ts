import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { AllChatSessions, FriendId, ChatMessage, ChatId, FriendList, ChatRoomType, PendingFriendRequest, FriendStatus } from './chat-types';
import { getFriendList, getUserInbox, getMessageHistory, updateReadReceipt as apiUpdateReadReceipt, getPendingFriendRequests, getAllFriendshipStatuses } from '../api';
import debounce from 'lodash.debounce';
import { authService } from '@/features/auth/api/authService';
import { enableMapSet } from "immer";

enableMapSet();

export interface ChatState {
  currentChatSessionId: ChatId | null;
  allChatSessions: AllChatSessions;
  allAcceptedFriends: FriendList;
  pendingRequests: PendingFriendRequest[];
  isLoadingUserInbox: boolean
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
      isLoadingUserInbox: true,
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
          const session = state.allChatSessions[msg.chatId]; 
          if (!session) return; 
          
          if (!session.messages) session.messages = [];

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
          const rawSessions = await getUserInbox()
          set((state) => {
            state.isLoadingUserInbox = false;
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
                lastReadMessageId: session.lastReadMessageId || 0,
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
      
      // 1. Update global receipt map
      // 2. Update session receipt map
      // 3. Update personal field
      sendReadReceipt: async (chatId: ChatId, userId: FriendId, messageId: number) => {
        const currentState = get();
        const currentMessageId = currentState.readReceipts[chatId]?.[userId] || 0;
        if (messageId <= currentMessageId) return;

        try {
          set((state) => {
            if (!state.readReceipts[chatId]) state.readReceipts[chatId] = {};
            state.readReceipts[chatId][userId] = messageId;

            if (state.allChatSessions[chatId]) {
              if (!state.allChatSessions[chatId].readReceipts) {
                state.allChatSessions[chatId].readReceipts = {};
              }
              state.allChatSessions[chatId].readReceipts![userId] = messageId;
              
              state.allChatSessions[chatId].lastReadMessageId = messageId;
            }
          });

          await apiUpdateReadReceipt(chatId, messageId);
        } catch (error) {
          console.error('Failed to send read receipt:', error);
        }
      },

      updateChatPermission: (chatId: string | null, allowed: boolean) => {
        set((state) => {
          if (chatId) {
            state.allChatSessions[chatId].isAllowedChat = allowed;
          }
        });
      },

    }))
  );
};

export type UserDisplay = {
  displayName: string | null;
  avatarImage: string | null;
};

export type UserDisplayState = {
  displayById: Record<number, UserDisplay>;
  loadingIds: Set<number>;

  fetchUserDisplays: (ids: number[]) => Promise<void>;
};

export type UserDisplayStore = UserDisplayState;

export const createUserDisplayStore = () => {
  return createStore<UserDisplayState>()(
    immer((set, get) => ({
      displayById: {},
      loadingIds: new Set(),

      fetchUserDisplays: async (ids: number[]) => {
        const state = get();

        const idsToLoad = ids.filter(
          (id) =>
            typeof id === "number" &&
            id > 0 &&
            !state.displayById[id] &&
            !state.loadingIds.has(id)
        );

        if (idsToLoad.length === 0) return;

        // mark loading
        set((s) => {
          idsToLoad.forEach((id) => s.loadingIds.add(id));
        });

        const results = await Promise.all(
          idsToLoad.map(async (id) => {
            try {
              const user = await authService.getUserById(id);

              return {
                id,
                displayName:
                  user.username?.trim() ||
                  user.fullName?.trim() ||
                  null,
                avatarImage:
                  user.avatarImage ?? user.avatarUrl ?? null,
              };
            } catch {
              return {
                id,
                displayName: null,
                avatarImage: null,
              };
            }
          })
        );

        // write results
        set((s) => {
          results.forEach((r) => {
            s.displayById[r.id] = {
              displayName: r.displayName,
              avatarImage: r.avatarImage,
            };
            s.loadingIds.delete(r.id);
          });
        });
      },
    }))
  );
};