'use client';

import React, { useState, useEffect } from 'react';
import { FriendCard } from '@/features/chat/ui';
import { useFriendList, useChatActions } from '@/features/chat/models';
import { updateFriendshipStatus } from '@/features/chat/api';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';

type TabType = 'Online' | 'All' | 'Pending' | 'Blocked';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { allAcceptedFriends, pendingRequests, currentUserId, isLoading, error } = useFriendList();
  const { fetchAllAcceptedFriends, fetchPendingFriendships } = useChatActions();

  useEffect(() => {
    if (currentUserId) {
      fetchAllAcceptedFriends();
      fetchPendingFriendships();
    }
  }, [currentUserId, fetchAllAcceptedFriends, fetchPendingFriendships]);

  const handleUpdateStatus = async (friendId: number, status: 'accepted' | 'requested') => {
    if (currentUserId) {
      await updateFriendshipStatus(friendId, status); // assuming requester -> receiver
      fetchPendingFriendships();
      fetchAllAcceptedFriends();
    }
  };

  const getFilteredList = () => {
    if (activeTab === 'Pending') {
      return (pendingRequests || []).filter(req => {
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const friendName = `Friend #${req.requesterId}`.toLowerCase();
          if (!friendName.includes(searchLower)) return false;
        }
        return true;
      }).map(req => ({
        friendId: req.requesterId,
        chatId: '', // No chat ID yet for pending
        isOnline: false
      }));
    }

    return allAcceptedFriends?.filter(friend => {
      // Filter by tab
      if (activeTab === 'Online' && !friend.isOnline) return false;
      // Pending and Blocked not implemented in basic data yet
      if (activeTab === 'Blocked') return false;
      
      // Filter by search
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const friendName = `Friend #${friend.friendId}`.toLowerCase();
        if (!friendName.includes(searchLower)) return false;
      }
      
      return true;
    }) || [];
  };

  const filteredFriends = getFilteredList();

  return (
    <div className="flex flex-col h-full bg-base-100 w-full text-base-content">
      
      {/* Top Header Navigation (Discord Style) */}
      <header className="flex px-4 items-center h-14 border-b border-base-300 shrink-0 shadow-sm z-10 overflow-x-auto custom-scrollbar">
        {/* Title Side */}
        <div className="flex items-center gap-2 font-bold text-base border-r border-base-300 pr-2 sm:pr-4 mr-2 sm:mr-4 shrink-0">
          <Link href="/messages" className="md:hidden btn btn-ghost btn-circle btn-sm mr-3 opacity-70 shrink-0">
            <ArrowLeft className="size-5" />
          </Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-base-content/70 sm:block shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <span className="hidden sm:inline">Friends</span>
        </div>

        {/* Tabs */}
        <div className="flex bg-base-200 rounded-box p-1 gap-1 shrink-0">
          <button 
            onClick={() => setActiveTab('All')}
            className={`btn btn-xs sm:btn-sm border-none shadow-none ${activeTab === 'All' ? 'bg-base-300 text-base-content' : 'bg-transparent text-base-content/60'}`}
          >
            All
          </button>
          <button 
            onClick={() => setActiveTab('Online')}
            className={`btn btn-xs sm:btn-sm border-none shadow-none ${activeTab === 'Online' ? 'bg-base-300 text-base-content' : 'bg-transparent text-base-content/60'}`}
          >
            Online
          </button>
          <button 
            onClick={() => setActiveTab('Pending')}
            className={`btn btn-xs sm:btn-sm border-none shadow-none ${activeTab === 'Pending' ? 'bg-base-300 text-base-content' : 'bg-transparent text-base-content/60'}`}
          >
            Pending
          </button>
        </div>

        {/* Add Friend Button */}
        <div className="ml-auto pl-2 shrink-0 flex items-center">
          <button className="btn btn-xs sm:btn-sm btn-primary text-success-content font-medium">
            Add Friend
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
        {/* List Header */}
        <div className="border-b border-base-300 pb-2 mb-4 text-xs font-bold text-base-content/60 uppercase tracking-widest">
          {activeTab} — {filteredFriends.length}
        </div>

        {/* Feedback Messages */}
        {isLoading && <div className="text-sm opacity-70 p-4">Loading friends...</div>}
        {error && <div className="text-sm text-error p-4">{error}</div>}
        {!isLoading && !error && filteredFriends.length === 0 && (
          <div className="text-sm opacity-70 p-4">
            {activeTab === 'Online' ? 'No friends online.' : 'No friends found.'}
          </div>
        )}

        {/* Friends List */}
        {!isLoading && !error && (
        <div className="space-y-1">
          {filteredFriends.map((friend) => (
            <FriendCard 
              key={friend.friendId} 
              friend={friend} 
              isPending={activeTab === 'Pending'}
              onAccept={() => handleUpdateStatus(friend.friendId, 'accepted')}
              onDecline={() => handleUpdateStatus(friend.friendId, 'requested')}
            />
          ))}
        </div>
        )}
      </div>
    </div>
  );
}