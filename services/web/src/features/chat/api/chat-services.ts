import { apiClient } from '@/lib/apiClient';
import type { StreamEvent, ChatId, ChatMessage, FriendStatus, FriendId, FriendList, PendingFriendRequest, SendMessageRequest, ChatRoom } from '../models/chat-types';

const CHAT_API_BASE_PREFIX = '/chat';

export async function getFriendList(): Promise<FriendList> {
  return apiClient.get<FriendList>(`${CHAT_API_BASE_PREFIX}/friendship`);
}

export async function getPendingFriendRequests(): Promise<PendingFriendRequest[]> {
  return apiClient.get<PendingFriendRequest[]>(`${CHAT_API_BASE_PREFIX}/friendship/pending`);
}

export async function sendFriendRequest(receiverId: FriendId): Promise<void> {
  return apiClient.post<void>(`${CHAT_API_BASE_PREFIX}/friendship/${receiverId}`);
}

export async function updateFriendshipStatus(receiverId: FriendId, status: FriendStatus): Promise<void> {
  return apiClient.patch<void>(`${CHAT_API_BASE_PREFIX}/friendship/${receiverId}?status=${status}`);
}

export async function sendMessage(chatId: ChatId, message: SendMessageRequest): Promise<void> {
  return apiClient.post<void>(`${CHAT_API_BASE_PREFIX}/message/${chatId}`, message);
}

export async function getMessageHistory(chatId: ChatId): Promise<ChatMessage[]> {
  return apiClient.get<ChatMessage[]>(`${CHAT_API_BASE_PREFIX}/message/history/${chatId}`);
}

// 2. Initialize the connection
// 3. Listen for incoming messages
// SSE sends data as a string. We must parse it to match your ChatMessage schema.
// Pass the parsed object to the UI (which will push it to Zustand)
// 4. Handle errors (like network drops or 401 Unauthorized)
// Note: EventSource automatically attempts to reconnect on its own.
// If you receive a 401, you might want to explicitly call sse.close() here.
// 5. Return the object so your SSEStreamController can call .close() on unmount
export function getMessageStream(
  onStreamChunkReceived: (event: StreamEvent) => void
): EventSource {
  const sse = new EventSource(`/api/stream${CHAT_API_BASE_PREFIX}/message/stream`, { withCredentials: true });
  // const sse = new EventSource(`http://localhost:8003/message/stream`, { withCredentials: true });

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

export async function getUserInbox(): Promise<ChatRoom[]> {
  return apiClient.get<ChatRoom[]>(`${CHAT_API_BASE_PREFIX}/message/inbox`);
}

export async function createGroupChat(
  payload: { name: string; memberIds: FriendId[] }
): Promise<ChatRoom> {
  return apiClient.post<ChatRoom>(`${CHAT_API_BASE_PREFIX}/message/group/create`, payload);
}

export async function sendTypingEvent(chatId: ChatId): Promise<void> {
  return apiClient.post<void>(`${CHAT_API_BASE_PREFIX}/message/typing/${chatId}`);
}

export async function updateReadReceipt(chatId: ChatId, messageId: number): Promise<void> {
  return apiClient.patch<void>(`${CHAT_API_BASE_PREFIX}/message/read/${chatId}`, { messageId });
}

export async function sendMessageRequest(receiverId: FriendId, message: SendMessageRequest): Promise<void> {
  return apiClient.post<void>(`${CHAT_API_BASE_PREFIX}/message/request/${receiverId}`, message);
}

export async function acceptMessageRequest(requesterId: FriendId): Promise<void> {
  return apiClient.patch<void>(`${CHAT_API_BASE_PREFIX}/message/request/${requesterId}/accept`);
}