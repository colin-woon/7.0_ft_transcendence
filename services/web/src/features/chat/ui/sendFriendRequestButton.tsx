'use client';

import { sendFriendRequest } from '../api/chat-services';
import { useCurrentChatSession } from '../models';

export function SendFriendRequestButton() {
  const userSession = useCurrentChatSession();

  return (
        <button className="btn btn-primary" onClick={() => sendFriendRequest(userSession.userId!, 3)}>Send Friend Request</button>
  );
}
