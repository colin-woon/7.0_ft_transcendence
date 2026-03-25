'use client';

import { sendFriendRequest } from '../api/chat-services';
import { useChat } from '../models';

export function SendFriendRequestButton() {
  const userChat = useChat();

  return (
        <button className="btn btn-primary" onClick={() => sendFriendRequest(userChat.tempCurrentUserId!, 3)}>Send Friend Request</button>
  );
}
