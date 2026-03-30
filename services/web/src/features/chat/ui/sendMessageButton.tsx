'use client';

import { useEffect, useState } from 'react';
import { getFriendList, sendMessage } from '../api/chat-services';
import { useCurrentChatSession, useChat } from '../models';

export function SendMessageButton() {
  const userSession = useCurrentChatSession();
  const userChat = useChat();

  // 1. Create a state variable for the input text
  const [messageText, setMessageText] = useState('');
  const tempTargetFriendId = 1;

  useEffect(() => {
    const fetchFriends = async () => {
      if (!userSession.chatId && userChat.tempCurrentUserId) {
        try {
          const friends = await getFriendList(userChat.tempCurrentUserId);
          const friend = friends.find(f => f.friendId === tempTargetFriendId);
          if (friend) {
            userChat.setSession(friend.chatId);
          }
        } catch (error) {
          console.error("Failed to fetch friends:", error);
        }
      }
    };
    fetchFriends();
  }, [userChat.tempCurrentUserId, userSession.chatId]);

  // Only send if there is text and a valid chatId
  // 2. Use the state variable here
  // 3. Clear the input after sending
  const handleSend = () => {
    if (messageText.trim() && userSession.chatId) {
      sendMessage(
        userSession.chatId,
        userChat.tempCurrentUserId!,
        1,
        { content: messageText }
      );
      setMessageText('');
      userChat.addMessage({
        id: "msg-" + userChat.tempCurrentUserId + '-' + Date.now(),
        chatId: userSession.chatId!,
        senderId: userChat.tempCurrentUserId!,     
        recipientId: tempTargetFriendId, 
        content: messageText,
        createdAt: new Date().toISOString() // Or grab from backend payload if available
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
        disabled={!messageText.trim()}
      >
        Send Message
      </button>
    </div>
  );
}