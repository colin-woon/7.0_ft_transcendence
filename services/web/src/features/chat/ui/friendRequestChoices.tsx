'use client';

import { updateFriendshipStatus } from '../api/chat-services';
import { useChat } from '../models';

export function FriendRequestChoices() {
  const userChat = useChat();
  const tempTargetFriendId = 2; // TEMP Hardcoded target friend ID for demo

  return (
    <div className="flex flex-row gap-2">
        <button className="btn btn-success" onClick={() => updateFriendshipStatus(userChat.tempCurrentUserId!, tempTargetFriendId, 'accepted')}>Accept</button>
        <button className="btn btn-error" onClick={() => updateFriendshipStatus(userChat.tempCurrentUserId!, tempTargetFriendId, 'declined')}>Decline</button>
    </div>
  );
}
