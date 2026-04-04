'use client';

import { updateFriendshipStatus } from '../api/chat-services';
import { useAllChatSessions } from '../models';

export function FriendRequestChoices() {
  const { tempCurrentUserId } = useAllChatSessions();
  const tempTargetFriendId = 3; // TEMP Hardcoded target friend ID for demo

  return (
    <div className="flex flex-row gap-2">
        <button className="btn btn-success" onClick={() => updateFriendshipStatus(tempCurrentUserId!, tempTargetFriendId, 'accepted')}>Accept</button>
        <button className="btn btn-error" onClick={() => updateFriendshipStatus(tempCurrentUserId!, tempTargetFriendId, 'declined')}>Decline</button>
    </div>
  );
}
