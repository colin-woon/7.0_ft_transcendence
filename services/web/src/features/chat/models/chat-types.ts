export type FriendId = number; 
export type ChatId = string; 
export type AllSessions = Record<ChatId, ChatMessage[]>;

export interface Friendship {
  chatId: ChatId;
  friendId: FriendId;
}

export type FriendList = Friendship[];

export interface ChatMessage {
    id: ChatId;
    senderId: FriendId;
    recipientId: FriendId;
    content: string;
    createdAt: string;
}

export type FriendStatus = 'pending' | 'accepted' | 'blocked' | 'declined' | 'none';

export interface SendMessagePayload {
    content: string;
}

export interface UserSession {
    chatId: ChatId | null;
    messages: ChatMessage[];
}

export interface ChatContextType {
  tempCurrentUserId: FriendId | null;
  session: UserSession;   // All chat messages between current user + 1 friend
  sessions: AllSessions;  // All chats by one user, keyed by friendId
  setSession: (chatId: ChatId) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
}