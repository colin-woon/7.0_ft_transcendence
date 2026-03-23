import { create } from 'zustand';
import { getFriendList } from '../api/services';
import type { FriendList } from './types';

interface ChatStore {
  friends: FriendList | null;
  fetchFriends: (userId: number) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set)  => ({
  friends: null,
  fetchFriends: async (userId : number) => {
    const data = await getFriendList(userId);
    set({ friends: data });
  },
}));
