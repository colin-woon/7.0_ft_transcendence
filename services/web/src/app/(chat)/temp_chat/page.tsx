'use client';

import { getFriendList, sendFriendRequest, updateFriendshipStatus, sendMessage, getMessageHistory, getMessageStream } from '@/features/chat/api/services';

export default function MessagesPage() {
  return (
    <div className="p-20 flex flex-col gap-4">
      <button className="btn btn-primary" onClick={() => getFriendList(1)}>Get Friend List</button>
      <button className="btn btn-primary" onClick={() => sendFriendRequest(1, 2)}>Send Friend Request</button>
      <button className="btn btn-primary" onClick={() => updateFriendshipStatus(1, 2, 'accepted')}>Update Friendship Status</button>
      <button className="btn btn-primary" onClick={() => sendMessage("63cbd063-0887-4534-b97b-578095b2e0d5", 1, 2, { content: "Hello!"})}>Send Message</button>
      <button className="btn btn-primary" onClick={() => getMessageHistory("63cbd063-0887-4534-b97b-578095b2e0d5")}>Get Message History</button>
      <button className="btn btn-primary" onClick={() => getMessageStream(2)}>Get Message Stream</button>
    </div>
  );
}
