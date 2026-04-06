import { ChatStoreContext } from './chat-provider';
import type { ChatMessage, FriendId, FriendList } from './chat-types';
import { useStore } from 'zustand';
import { useContext, useState } from 'react';
import { createGroupChat } from '../api/chat-services';

const EMPTY_MESSAGES: ChatMessage[] = [];
const EMPTY_FRIENDIDS: FriendId[] = [];
const EMPTY_TYPING_USERS: Record<FriendId, ReturnType<typeof setTimeout>> = {};

export const useChatActions = () => {
    const store = useContext(ChatStoreContext);
    if (!store) throw new Error('useChatActions must be used within ChatStoreProvider');

    return {
        setTempCurrentUserId: useStore(store, (s) => s.setTempCurrentUserId),
        setChatSession: useStore(store, (s) => s.setChatSession),
        addMessage: useStore(store, (s) => s.addMessage),
        setCurrentChatSessionId: useStore(store, (s) => s.setCurrentChatSessionId),
        fetchAllFriendships: useStore(store, (s) => s.fetchAllFriendships),
        fetchAllChatSessions: useStore(store, (s) => s.fetchAllChatSessions),
        fetchChatHistory: useStore(store, (s) => s.fetchChatHistory),
        setTypingStatus: useStore(store, (s) => s.setTypingStatus),
    };
}

// Derived Hook for specific session logic
// useStore slices prevent unnecessary re-renders
// For your one on one chats
export const useCurrentChatSession = () => {
    const store = useContext(ChatStoreContext);
    if (!store) throw new Error('useCurrentSession must be used within ChatStoreProvider');

    return {
        tempCurrentUserId: useStore(store, (s) => s.tempCurrentUserId),
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
    };
};

// For all of your friends
export const useAllChatSessions = () => {
    const store = useContext(ChatStoreContext);
    if (!store) throw new Error('useChat must be used within a ChatStoreProvider');

    return {
        tempCurrentUserId: useStore(store, (s) => s.tempCurrentUserId),
        allChatSessions: useStore(store, (s) => s.allChatSessions),
    };
};

export const useFriendList = () => {
    const store = useContext(ChatStoreContext);
    if (!store) throw new Error('ChatStoreContext not found');
    return {
        tempCurrentUserId: useStore(store, (s) => s.tempCurrentUserId),
        allFriendships: useStore(store, (s) => s.allFriendships),
        isLoading: useStore(store, (s) => s.isLoadingFriends), 
        error: useStore(store, (s) => s.friendsError),
    };
};