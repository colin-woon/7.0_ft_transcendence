'use client';

import { useEffect, useRef, useState } from 'react';
import { getFriendList, getMessageHistory } from '../api/chat-services';
import { useAllChatSessions } from '../models';
import type { Friendship, ChatId, ChatMessage } from '../models/chat-types';

const FALLBACK_AVATAR_URL =
  'https://img.daisyui.com/images/profile/demo/gordon@192.webp';

export function FriendList() {
  const { tempCurrentUserId, currentChatSession, setChatSession } = useAllChatSessions();

  const [friends, setFriends] = useState<Friendship[]>([]);
  // const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 3: prevent repeated auto-select loops
  const hasAutoSelectedRef = useRef(false);

  // const fetchChatHistory = async (chatId: ChatId): Promise<void> => {
  //   try {
  //     const history = await getMessageHistory(chatId);
  //     setMessages(history);
  //   } catch (error) {
  //     console.error('Failed to fetch chat history:', error);
  //     setMessages([]);
  //   }
  // }

  useEffect(() => {
    let isCancelled = false;

    const fetchFriends = async () => {
      if (!tempCurrentUserId) {
        setFriends([]);
        setIsLoading(false);
        hasAutoSelectedRef.current = false;
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getFriendList(tempCurrentUserId);
        if (!isCancelled) {
          setFriends(result);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage('Failed to load friends.');
          console.error('Failed to fetch friend list:', error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFriends();

    return () => {
      isCancelled = true;
    };
  }, [tempCurrentUserId]);

  const handleSelectFriend = (friend: Friendship) => {
    if (currentChatSession.chatId === friend.chatId) return;

    // fetchChatHistory(friend.chatId);

    setChatSession(friend.chatId, [friend.friendId], []);
    // setMessages([]);
  };

  // Step 3: auto-select first friend once when no session exists
  useEffect(() => {
    if (isLoading) return;
    if (hasAutoSelectedRef.current) return;
    if (currentChatSession.chatId) return;
    if (friends.length === 0) return;

    hasAutoSelectedRef.current = true;
    setChatSession(friends[0].chatId, [friends[0].friendId], []);

  }, [isLoading, friends, currentChatSession.chatId, setChatSession]);

  if (isLoading) {
    return <div className="text-sm opacity-70">Loading friends...</div>;
  }

  if (errorMessage) {
    return <div className="text-sm text-error">{errorMessage}</div>;
  }

  if (friends.length === 0) {
    return <div className="text-sm opacity-70">No friends yet.</div>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {friends.map((friend) => {
        const isSelected = currentChatSession.chatId === friend.chatId;

        return (
          <button
            key={friend.chatId}
            type="button"
            onClick={() => handleSelectFriend(friend)}
            className="flex flex-col items-center gap-2"
            aria-pressed={isSelected}
          >
            <div className="avatar">
              <div
                className={[
                  'w-16 rounded-full ring ring-offset-2 ring-offset-base-100 transition',
                  isSelected
                    ? 'ring-primary scale-105'
                    : 'ring-base-300 hover:ring-primary/50',
                ].join(' ')}
              >
                <img
                  src={FALLBACK_AVATAR_URL}
                  alt={`Friend ${friend.friendId}`}
                />
              </div>
            </div>
            <p
              className={[
                'text-xs',
                isSelected ? 'font-semibold text-primary' : 'opacity-80',
              ].join(' ')}
            >
              Friend #{friend.friendId}
            </p>
          </button>
        );
      })}
    </div>
  );
}