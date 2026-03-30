import { apiClient } from '@/lib/apiClient';
import type { SendMessagePayload, ChatId, ChatMessage, FriendStatus, FriendId, FriendList } from '../models/chat-types';

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

export async function getMessageHistory(chatId: ChatId): Promise<ChatMessage[]> {
  return apiClient.get<ChatMessage[]>(`/message/history/${chatId}`);
}

export function getMessageStream(
  tempUserId: number, 
  onMessageReceived: (message: ChatMessage) => void
): EventSource {
  // 2. Initialize the connection
  const sse = new EventSource(`http://localhost:8003/message/stream/${tempUserId}`);

  // 3. Listen for incoming messages
  sse.onmessage = (event) => {
    try {
      // SSE sends data as a string. We must parse it to match your ChatMessage schema.
      const rawMessage = JSON.parse(event.data);

      const formattedMessage: ChatMessage = {
        
      }
      // Pass the parsed object to the UI (which will push it to Zustand)
      onMessageReceived(formattedMessage);
      
    } catch (error) {
      console.error("Error parsing incoming chat message:", error);
    }
  };

  // 4. Handle errors (like network drops or 401 Unauthorized)
  sse.onerror = (error) => {
    console.error("SSE Connection Error. Attempting to reconnect...", error);
    // Note: EventSource automatically attempts to reconnect on its own.
    // If you receive a 401, you might want to explicitly call sse.close() here.
  };

  // 5. Return the object so your MessageStreamController can call .close() on unmount
  return sse;
}
