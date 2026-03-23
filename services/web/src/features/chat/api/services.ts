import { apiClient } from '@/lib/apiClient';
import type { SendMessagePayload, ChatId, ChatMessage, FriendStatus, FriendId, FriendList } from '../models/types';

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

export async function sendMessage(chatId: ChatId, tempSenderId: FriendId, tempReceiverId: FriendId, message: SendMessagePayload): Promise<void>{
  return apiClient.post<void>(`/message/${chatId}/${tempSenderId}/${tempReceiverId}`, message);
}

export async function getMessageHistory(chatId: ChatId): Promise<ChatMessage> {
  return apiClient.get<ChatMessage>(`/message/history/${chatId}`);
}

export async function getMessageStream(tempUserId: FriendId): Promise<ChatMessage> {
  return apiClient.get<ChatMessage>(`/message/stream/${tempUserId}`);
}
