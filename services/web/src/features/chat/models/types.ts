export type FriendId = number; 
export type ChatId = string; 
export type FriendList = FriendId[];

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