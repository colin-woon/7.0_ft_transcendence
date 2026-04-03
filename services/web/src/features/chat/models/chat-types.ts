export type FriendId = number; 
export type ChatId = string; 

export interface Friendship {
  friendId: FriendId;
  chatId: ChatId;
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
  userId: string;
  isTyping: boolean;
}

export interface UserStatus {
  userId: string;
  status: 'online' | 'offline';
}

export type ChatRoomType = 'group' | 'direct';

export interface ChatRoom {
    chatId: string;
    type: ChatRoomType;
    name: string | null;
    memberIds: FriendId[];
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked' | 'declined' | 'none';

export interface SendMessageRequest {
  content: string;
}

export type StreamEvent =
  | { type: 'NEW_MESSAGE'; payload: ChatMessage }
  | { type: 'USER_TYPING'; payload: UserTyping }
  | { type: 'USER_STATUS'; payload: UserStatus };

export interface ChatSession {
    chatId: ChatId;
    friendIds: FriendId[];
    messages: ChatMessage[];
}

export type AllChatSessions = Record<ChatId, ChatSession>;

export interface ChatContextType {
  tempCurrentUserId: FriendId | null;
  currentChatSession: ChatSession;
  allChatSessions: AllChatSessions;
  setChatSession: (chatId: ChatId, friendIds: FriendId[], messages: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
}