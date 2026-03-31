'use client';

import { useEffect, useRef, useState } from 'react';
import { getFriendList } from '../api/chat-services';
import { useChat } from '../models';
import type { Friendship } from '../models/chat-types';

const FALLBACK_AVATAR_URL =
  'https://img.daisyui.com/images/profile/demo/gordon@192.webp';

export function FriendList() {
  const { tempCurrentUserId, session, setSession, setMessages } = useChat();

  const [friends, setFriends] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 3: prevent repeated auto-select loops
  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

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
        if (!cancelled) {
          setFriends(result);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage('Failed to load friends.');
          console.error('Failed to fetch friend list:', error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchFriends();

    return () => {
      cancelled = true;
    };
  }, [tempCurrentUserId]);

  const handleSelectFriend = (friend: Friendship) => {
    if (session.chatId === friend.chatId) return;

    setSession(friend.chatId);
    setMessages([]);
  };

  // Step 3: auto-select first friend once when no session exists
  useEffect(() => {
    if (isLoading) return;
    if (hasAutoSelectedRef.current) return;
    if (session.chatId) return;
    if (friends.length === 0) return;

    hasAutoSelectedRef.current = true;
    setSession(friends[0].chatId);
    setMessages([]);
  }, [isLoading, friends, session.chatId, setSession, setMessages]);

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
        const isSelected = session.chatId === friend.chatId;

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