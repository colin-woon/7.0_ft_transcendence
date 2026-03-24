export type FriendId = number; 
export type ChatId = string; 
export type FriendList = FriendId[];
export type AllSessions = Record<FriendId, ChatMessage[]>;

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
    userId: FriendId | null;
    messages: ChatMessage[];
}

export interface ChatContextType {
  session: UserSession;   // All chat messages between current user + 1 friend
  sessions: AllSessions;  // All chats by one user, keyed by friendId
  setSession: (userId: FriendId) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}