'use client';

import { useEffect, useState } from 'react';
import { getFriendList, sendMessage } from '../api/chat-services';
import { useCurrentChatSession, useChat } from '../models';

export function SendMessageButton() {
  const userSession = useCurrentChatSession();
  const userChat = useChat();

  const [messageText, setMessageText] = useState('');
  const [recipientFriendId, setRecipientFriendId] = useState<number | null>(null);

  // Fetch friends and find the recipient for the current chatId
  useEffect(() => {
    if (!userSession.chatId || !userChat.tempCurrentUserId) {
      setRecipientFriendId(null);
      return;
    }

    const fetchAndMatchFriend = async () => {
      try {
        const friends = await getFriendList(userChat.tempCurrentUserId!);
        const friend = friends.find(f => f.chatId === userSession.chatId);
        if (friend) {
          setRecipientFriendId(friend.friendId);
        }
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      }
    };

    fetchAndMatchFriend();
  }, [userSession.chatId, userChat.tempCurrentUserId]);

  const handleSend = () => {
    if (messageText.trim() && userSession.chatId && recipientFriendId !== null && userChat.tempCurrentUserId) {
      sendMessage(
        userSession.chatId,
        userChat.tempCurrentUserId,
        recipientFriendId,
        { content: messageText }
      );
      setMessageText('');
      userChat.addMessage({
        id: "msg-" + userChat.tempCurrentUserId + '-' + Date.now(),
        chatId: userSession.chatId,
        senderId: userChat.tempCurrentUserId,
        recipientId: recipientFriendId,
        content: messageText,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Type a message..."
        className="input input-bordered w-full"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
      />
      <button
        className="btn btn-primary"
        onClick={handleSend}
        disabled={!messageText.trim() || !userSession.chatId}
      >
        Send Message
      </button>
    </div>
  );
}