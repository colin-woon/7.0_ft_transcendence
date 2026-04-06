import { apiClient } from '@/lib/apiClient';
import type { StreamEvent, ChatId, ChatMessage, FriendStatus, FriendId, FriendList, SendMessageRequest, ChatRoom } from '../models/chat-types';

// export async function login(credentials: LoginInput): Promise<User> {
//   return apiClient.post<User>('/auth/login', credentials);
// }

export async function getFriendList(tempUserId: FriendId): Promise<FriendList> {
  return apiClient.get<FriendList>(`/friendship/${tempUserId}`);
}

export async function sendFriendRequest(tempRequesterId: FriendId, tempReceiverId: FriendId): Promise<void>{
  return apiClient.post<void>(`/friendship/${tempRequesterId}/${tempReceiverId}`);
}

export async function updateFriendshipStatus(tempRequesterId: FriendId, tempReceiverId: FriendId, status: FriendStatus): Promise<void> {
  return apiClient.patch<void>(`/friendship/${tempRequesterId}/${tempReceiverId}/update?status=${status}`);
}

export async function sendMessage(chatId: ChatId, tempSenderId: FriendId, message: SendMessageRequest): Promise<void>{
  return apiClient.post<void>(`/message/${chatId}/${tempSenderId}`, message);
}

export async function getMessageHistory(chatId: ChatId): Promise<ChatMessage[]> {
  return apiClient.get<ChatMessage[]>(`/message/history/${chatId}`);
}

// 2. Initialize the connection
// 3. Listen for incoming messages
// SSE sends data as a string. We must parse it to match your ChatMessage schema.
// Pass the parsed object to the UI (which will push it to Zustand)
// 4. Handle errors (like network drops or 401 Unauthorized)
// Note: EventSource automatically attempts to reconnect on its own.
// If you receive a 401, you might want to explicitly call sse.close() here.
// 5. Return the object so your MessageStreamController can call .close() on unmount
export function getMessageStream(
  tempUserId: number, 
  onStreamChunkReceived: (event: StreamEvent) => void
): EventSource {
  const sse = new EventSource(`http://localhost:8003/message/stream/${tempUserId}`);

  sse.onmessage = (streamResponse) => {
    try {
      const event = streamResponse.data;
      onStreamChunkReceived(JSON.parse(event) as StreamEvent);
    } catch (error) {
      console.error("Error parsing incoming SSE response:", error);
    }
  };
  sse.onerror = (error) => {
    console.error("SSE Connection Error. Attempting to reconnect...", error);
  };
  return sse;
}

export async function getUserInbox(tempUserId: FriendId): Promise<ChatRoom[]> {
  return apiClient.get<ChatRoom[]>(`/message/inbox/${tempUserId}`);
}

export async function createGroupChat(
  tempUserId: FriendId, 
  payload: { name: string; memberIds: FriendId[] }
): Promise<ChatRoom> {
  return apiClient.post<ChatRoom>(`/message/group/create/${tempUserId}`, payload);
}

export async function sendTypingEvent(chatId: ChatId, tempSenderId: FriendId): Promise<void>{
  return apiClient.post<void>(`/message/typing/${chatId}/${tempSenderId}`);
}