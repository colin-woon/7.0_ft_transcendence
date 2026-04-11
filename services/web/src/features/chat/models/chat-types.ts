export type FriendId = number; 
export type ChatId = string; 

export interface Friendship {
  friendId: FriendId;
  chatId: ChatId;
  isOnline?: boolean;
}

export type FriendList = Friendship[];

export interface ChatMessage {
    id: number | string;
    chatId: ChatId;
    senderId: FriendId;
    content: string;
    createdAt: string;
}

export interface UserTyping {
  chatId: ChatId;
  senderId: FriendId;
}

export interface UserStatus {
  userId: number;
  isOnline: boolean;
}

export interface ReadReceipt {
  chatId: ChatId;
  userId: FriendId;
  messageId: number;
}

export type ChatRoomType = 'group' | 'direct';

export interface ChatRoom {
    chatId: string;
    type: ChatRoomType;
    name: string | null;
    memberIds: FriendId[];
    messages: ChatMessage[] | null;
    readReceipts?: Record<FriendId, number>; // Maps userId to lastReadMessageId
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked' | 'declined' | 'none';

export interface SendMessageRequest {
  content: string;
}

export type StreamEvent =
  | { type: 'NEW_MESSAGE'; payload: ChatMessage }
  | { type: 'USER_TYPING'; payload: UserTyping }
  | { type: 'USER_STATUS'; payload: UserStatus }
  | { type: 'USER_READ'; payload: ReadReceipt };

export type AllChatSessions = Record<ChatId, ChatRoom>;
