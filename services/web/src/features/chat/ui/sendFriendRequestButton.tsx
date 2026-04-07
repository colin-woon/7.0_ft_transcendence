'use client';

import { sendFriendRequest } from '../api/chat-services';
import { useAllChatSessions } from '../models';

export function SendFriendRequestButton() {
  const { tempCurrentUserId } = useAllChatSessions();

  return (
        <button className="btn btn-primary" onClick={() => sendFriendRequest(tempCurrentUserId!, 3)}>Send Friend Request</button>
  );
}
