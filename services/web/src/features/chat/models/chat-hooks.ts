'use client';

import { ChatStoreContext } from './chat-provider';
import type { ChatMessage, FriendId, ChatId } from './chat-types';
import { useStore } from 'zustand';
import { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createGroupChat } from '../api/chat-services';
import debounce from 'lodash.debounce';
import { useAuth } from '@/features/auth/models/AuthContext';

const EMPTY_MESSAGES: ChatMessage[] = [];
const EMPTY_FRIENDIDS: FriendId[] = [];
const EMPTY_TYPING_USERS: Record<FriendId, ReturnType<typeof setTimeout>> = {};
const EMPTY_READ_RECEIPTS: Record<FriendId, number> = {};

export const useChatActions = () => {
    const store = useContext(ChatStoreContext);
    if (!store) throw new Error('useChatActions must be used within ChatStoreProvider');

    return {
        setUserStatus: useStore(store, (s) => s.setUserStatus),
        setChatSession: useStore(store, (s) => s.setChatSession),
        addMessage: useStore(store, (s) => s.addMessage),
        setCurrentChatSessionId: useStore(store, (s) => s.setCurrentChatSessionId),
        fetchAllAcceptedFriends: useStore(store, (s) => s.fetchAllAcceptedFriends),
        fetchPendingFriendships: useStore(store, (s) => s.fetchPendingFriendships),
        fetchAllChatSessions: useStore(store, (s) => s.fetchAllChatSessions),
        fetchChatHistory: useStore(store, (s) => s.fetchChatHistory),
        setTypingStatus: useStore(store, (s) => s.setTypingStatus),
        updateReadReceipt: useStore(store, (s) => s.updateReadReceipt),
        sendReadReceipt: useStore(store, (s) => s.sendReadReceipt),
        updateChatPermission: useStore(store, (s) => s.updateChatPermission),
        fetchAllFriendshipStatuses: useStore(store, (s) => s.fetchAllFriendshipStatuses),
        setFriendshipStatus: useStore(store, (s) => s.setFriendshipStatus),
    };
}

// Derived Hook for specific session logic
// useStore slices prevent unnecessary re-renders
// For your one on one chats
export const useCurrentChatSession = () => {
    const store = useContext(ChatStoreContext);
    const { user } = useAuth();

    if (!store) throw new Error('useCurrentSession must be used within ChatStoreProvider');

    return {
        currentUserId: user?.id || null,
        chatId: useStore(store, (s) => s.currentChatSessionId),
        friendIds: useStore(store, (s) => 
        s.currentChatSessionId ? s.allChatSessions[s.currentChatSessionId]?.memberIds : EMPTY_FRIENDIDS
        ),
        chatSessionName: useStore(store, (s) => 
        s.currentChatSessionId ? s.allChatSessions[s.currentChatSessionId]?.name : null
        ),
        messages: useStore(store, (s) => {
        if (!s.currentChatSessionId) return EMPTY_MESSAGES;
        return s.allChatSessions[s.currentChatSessionId]?.messages || EMPTY_MESSAGES;
        }),
        typingUsers: useStore(store, (s) => {
            if (!s.currentChatSessionId) return EMPTY_TYPING_USERS;
            return s.typingUsers[s.currentChatSessionId] || EMPTY_TYPING_USERS;
        }),
        readReceipts: useStore(store, (s) => {
            if (!s.currentChatSessionId) return EMPTY_READ_RECEIPTS;
            return s.readReceipts[s.currentChatSessionId] || EMPTY_READ_RECEIPTS;
        }),
        isAllowedChat: useStore(store, (s) => {
            if (!s.currentChatSessionId) return false;
            return s.allChatSessions[s.currentChatSessionId]?.isAllowedChat === true;
        }),
        requestedBy: useStore(store, (s) => {
            if (!s.currentChatSessionId) return null;
            return s.allChatSessions[s.currentChatSessionId]?.requestedBy || null;
        }),
        friendshipStatus: useStore(store, (s) => {
            if (!s.currentChatSessionId) return null;
            return s.allChatSessions[s.currentChatSessionId]?.friendshipStatus || null;
        }),
    };
};

// For all of your friends
export const useAllChatSessions = () => {
    const store = useContext(ChatStoreContext);
    const { user } = useAuth();
    if (!store) throw new Error('useChat must be used within a ChatStoreProvider');

    return {
        currentUserId: user?.id || null,
        allChatSessions: useStore(store, (s) => s.allChatSessions),
    };
};

export const useFriendList = () => {
    const store = useContext(ChatStoreContext);
    const { user } = useAuth();
    if (!store) throw new Error('ChatStoreContext not found');
    return {
        currentUserId: user?.id || null,
        allAcceptedFriends: useStore(store, (s) => s.allAcceptedFriends),
        pendingRequests: useStore(store, (s) => s.pendingRequests),
        isLoading: useStore(store, (s) => s.isLoadingFriends), 
        error: useStore(store, (s) => s.friendsError),
    };
};

export const useCreateGroupChatAction = () => {
    const { allAcceptedFriends, currentUserId } = useFriendList();
    
    const [groupName, setGroupName] = useState('');
    const [selectedFriendIds, setSelectedFriendIds] = useState<FriendId[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleFriendId = (friendId: FriendId) => {
        setSelectedFriendIds(prev => 
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const resetForm = () => {
        setGroupName('');
        setSelectedFriendIds([]);
    };

    const submitGroupChat = async (onSuccess: () => void) => {
        if (!currentUserId || !groupName.trim() || selectedFriendIds.length === 0) return;
        
        try {
            setIsSubmitting(true);
            await createGroupChat({
                name: groupName,
                memberIds: selectedFriendIds
            });
            resetForm();
            onSuccess();
        } catch (error) {
            console.error("Failed to create group chat", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        groupName,
        setGroupName,
        selectedFriendIds,
        toggleFriendId,
        isSubmitting,
        submitGroupChat,
        resetForm,
        allAcceptedFriends
    };
};

interface UseMessageVisibilityOptions {
  chatId: ChatId | null;
  messages: ChatMessage[];
  userId: FriendId | null;
  onReadReceipt: (chatId: ChatId, userId: FriendId, messageId: number) => Promise<void>;
  debounceMs?: number;
  threshold?: number;
}

/**
 * Custom hook that tracks message visibility using Intersection Observer
 * and triggers debounced read receipt updates.
 * 
 * Features:
 * - Tracks which messages are visible in viewport
 * - Debounces updates to prevent excessive API calls
 * - Enforces monotonicity (only sends if messageId > last sent)
 * - Cleans up observers on unmount
 */
// Track visible message IDs
// Track last sent messageId to enforce monotonicity
// Track observers for cleanup
// Debounced function to send read receipt
// Double-check monotonicity before sending
// On error, reset lastSentMessageId so we can retry
// Handle visibility change for a message
// Find the highest visible message ID
// Only trigger if it's higher than what we've already sent
// Create observer for a message element
// Don't observe if already observing
// Cleanup function
// Cancel any pending debounced calls
// Disconnect all observers
// Clear visible message IDs
// Cleanup on unmount or when chatId changes
// Reset last sent ID when chat changes
// Return the observe function for components to attach to message elements
export function useMessageVisibility({
  chatId,
  userId,
  onReadReceipt,
  debounceMs = 500,
  threshold = 0.5,
}: UseMessageVisibilityOptions) {
  const visibleMessageIds = useRef<Set<number | string>>(new Set());
  
  const lastSentMessageId = useRef<number>(0);
  
  const observersRef = useRef<Map<Element, IntersectionObserver>>(new Map());

  const debouncedSendReceipt = useRef(
    debounce(async (cId: ChatId, uId: FriendId, msgId: number) => {
      if (msgId > lastSentMessageId.current) {
        lastSentMessageId.current = msgId;
        try {
          await onReadReceipt(cId, uId, msgId);
        } catch (error) {
          console.error('Failed to send read receipt:', error);
          lastSentMessageId.current = Math.max(0, msgId - 1);
        }
      }
    }, debounceMs)
  ).current;

  const handleVisibilityChange = useCallback(
    (messageId: number | string, isVisible: boolean) => {
      if (isVisible) {
        visibleMessageIds.current.add(messageId);
      } else {
        visibleMessageIds.current.delete(messageId);
      }

      if (chatId && userId && visibleMessageIds.current.size > 0) {
        const highestVisibleId = Array.from(visibleMessageIds.current).reduce<number>(
          (max, id) => {
            const numId = typeof id === 'number' ? id : parseInt(String(id), 10);
            return !isNaN(numId) && numId > max ? numId : max;
          },
          0
        );

        if (highestVisibleId > lastSentMessageId.current) {
            debouncedSendReceipt(chatId, userId, highestVisibleId);
        }
    }
    },
    [chatId, userId, debouncedSendReceipt]
    );

  const observeElement = useCallback(
    (element: Element, messageId: number | string) => {
      if (observersRef.current.has(element)) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            handleVisibilityChange(messageId, entry.isIntersecting && entry.intersectionRatio >= threshold);
          });
        },
        {
          threshold,
          // Optional: Add rootMargin to trigger slightly before entering viewport
          // rootMargin: '50px',
        }
      );

      observer.observe(element);
      observersRef.current.set(element, observer);
    },
    [handleVisibilityChange, threshold]
  );

  const cleanup = useCallback(() => {
    debouncedSendReceipt.cancel();
    
    observersRef.current.forEach((observer) => {
      observer.disconnect();
    });
    observersRef.current.clear();
    
    visibleMessageIds.current.clear();
  }, [debouncedSendReceipt]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [chatId, cleanup]);

  useEffect(() => {
    lastSentMessageId.current = 0;
  }, [chatId]);

  return {
    observeElement,
    cleanup,
  };
}

// Find the friend in the array by matching the friendId
export const useUserStatus = (userId: FriendId) => {
    const store = useContext(ChatStoreContext);
    if (!store) throw new Error('useUserOnlineStatus must be used within ChatStoreProvider');
    return useStore(store, (s) => {
        const friend = s.allAcceptedFriends.find((f: any) => f.friendId === userId);
        return friend?.isOnline || false;
    });};

export const useHasUnreadMessages = (chatId: ChatId | null) => {
    const store = useContext(ChatStoreContext);
    const { user } = useAuth();
    const currentUserId = user?.id || null;
    if (!store) throw new Error('useHasUnreadMessages must be used within ChatStoreProvider');
    
    return useStore(store, (s) => {
        if (!chatId || !currentUserId) return false;
        
        const chat = s.allChatSessions[chatId];
        if (!chat || !chat.messages || chat.messages.length === 0) return false;
        
        const latestMessage = chat.messages[0]; // messages are unshifted (newest first)
        if (latestMessage.senderId === currentUserId) return false; // Sent by myself
        
        const myReadReceipt = s.readReceipts[chatId]?.[currentUserId] || 0;
        
        const latestIdNum = typeof latestMessage.id === 'string' ? parseInt(latestMessage.id, 10) : latestMessage.id;
        
        return Math.floor(latestIdNum) > myReadReceipt;
    });
};

export const useIsAcceptedFriend = (friendId: FriendId | null) => {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('useIsAcceptedFriend must be used within ChatStoreProvider');

  return useStore(store, (s) => {
    if (!friendId) return false;
    return s.allAcceptedFriends.some((f) => f.friendId === friendId);
  });
};

export const useIsAllowedChat = (chatId: ChatId | null) => {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('useIsAllowedChat must be used within ChatStoreProvider');

  return useStore(store, (s) => {
    if (!chatId) return false;
    return s.allChatSessions[chatId]?.isAllowedChat === true;
  });
};

export const useAllFriendshipStatuses = () => {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error('useAllFriendshipStatuses must be used within ChatStoreProvider');

  return useStore(store, (s) => s.allFriendshipStatuses);
};
