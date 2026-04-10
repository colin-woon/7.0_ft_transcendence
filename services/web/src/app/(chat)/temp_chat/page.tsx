'use client';

import { ChatStoreProvider } from '@/features/chat/models';
import { SendFriendRequestButton, SendMessageButton, FriendRequestChoices, ChatBox, MessageStreamController, FriendList, ChatInbox, CreateGroupChatButton } from '@/features/chat/ui';

export default function MessagesPage() {
  return (
      <div className="p-20 flex flex-col gap-4">
        <FriendList />
        <CreateGroupChatButton />
        <SendFriendRequestButton />
        <FriendRequestChoices />
        <div className="p-4 flex flex-row">
          <ChatInbox/>
          <ChatBox />
        </div>
        <SendMessageButton />
        <MessageStreamController />
      </div>
  );
}
