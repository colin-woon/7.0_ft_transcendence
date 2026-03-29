'use client';

import { getMessageStream } from '@/features/chat/api/chat-services';
import { ChatStoreProvider } from '@/features/chat/models';
import { SendFriendRequestButton, SendMessageButton, FriendRequestChoices, ChatBox } from '@/features/chat/ui';

export default function MessagesPage() {
  return (
    <ChatStoreProvider>
      <div className="p-20 flex flex-col gap-4">
        <SendFriendRequestButton />
        <FriendRequestChoices />
        <ChatBox />
        <SendMessageButton />
        <button className="btn btn-primary" onClick={() => getMessageStream(2)}>Get Message Stream</button>
      </div>
    </ChatStoreProvider>
  );
}
