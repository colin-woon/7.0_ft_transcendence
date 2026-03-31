'use client';

import { getMessageStream } from '@/features/chat/api/chat-services';
import { ChatStoreProvider } from '@/features/chat/models';
import { SendFriendRequestButton, SendMessageButton, FriendRequestChoices, ChatBox, MessageStreamController, FriendList } from '@/features/chat/ui';

export default function MessagesPage() {
  return (
    <ChatStoreProvider>
      <div className="p-20 flex flex-col gap-4">
        <FriendList />
        <SendFriendRequestButton />
        <FriendRequestChoices />
        <ChatBox />
        <SendMessageButton />
        <MessageStreamController />
      </div>
    </ChatStoreProvider>
  );
}
