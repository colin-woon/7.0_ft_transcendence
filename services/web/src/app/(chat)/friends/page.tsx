'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AvatarWithStatus } from '@/features/chat/ui';
import { useFriendList, useChatActions } from '@/features/chat/models';

type TabType = 'Online' | 'All' | 'Pending' | 'Blocked';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { allFriendships, tempCurrentUserId, isLoading, error } = useFriendList();
  const { fetchAllFriendships } = useChatActions();

  useEffect(() => {
    if (tempCurrentUserId) {
      fetchAllFriendships(tempCurrentUserId);
    }
  }, [tempCurrentUserId, fetchAllFriendships]);

  const filteredFriends = allFriendships?.filter(friend => {
    // Filter by tab
    if (activeTab === 'Online' && !friend.isOnline) return false;
    // Pending and Blocked not implemented in basic data yet
    if (activeTab === 'Pending' || activeTab === 'Blocked') return false;
    
    // Filter by search
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const friendName = `Friend #${friend.friendId}`.toLowerCase();
      if (!friendName.includes(searchLower)) return false;
    }
    
    return true;
  }) || [];

  return (
    <div className="flex flex-col h-full bg-base-100 w-full text-base-content">
      
      {/* Top Header Navigation (Discord Style) */}
      <header className="flex justify-between px-4 items-center h-14 border-b border-base-300 shrink-0 shadow-sm z-10">
        <div className='flex items-center gap-2 font-bold text-base pr-4'>
        <div className="flex items-center gap-2 font-bold text-base border-r border-base-300 pr-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-base-content/70">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          Friends
        </div>

        {/* Tabs */}
        <div className="flex bg-base-200 rounded-box p-1 gap-1">
          <button 
            onClick={() => setActiveTab('All')}
            className={`btn btn-xs sm:btn-sm border-none shadow-none ${activeTab === 'All' ? 'bg-base-300 text-base-content hover:bg-base-300' : 'bg-transparent text-base-content/60 hover:bg-base-300/50 hover:text-base-content'}`}
            >
            All
          </button>
          <button 
            onClick={() => setActiveTab('Online')}
            className={`btn btn-xs sm:btn-sm border-none shadow-none ${activeTab === 'Online' ? 'bg-base-300 text-base-content hover:bg-base-300' : 'bg-transparent text-base-content/60 hover:bg-base-300/50 hover:text-base-content'}`}
            >
            Online
          </button>
          <button 
            onClick={() => setActiveTab('Pending')}
            className={`btn btn-xs sm:btn-sm border-none shadow-none ${activeTab === 'Pending' ? 'bg-base-300 text-base-content hover:bg-base-300' : 'bg-transparent text-base-content/60 hover:bg-base-300/50 hover:text-base-content'}`}
            >
            Pending
          </button>
        </div>
        </div>

        {/* Add Friend Button */}
        <button className="btn btn-xs sm:btn-sm btn-primary text-success-content font-medium">
          Add Friend
        </button>
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
            <div 
              key={friend.friendId}
              className="group flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors border-t border-transparent hover:border-base-300/50"
            >
              {/* Left Side: Avatar & Info */}
              <div className="flex items-center gap-3 w-1/2 min-w-0">
                <AvatarWithStatus 
                  userId={friend.friendId}
                  chatId={friend.chatId}
                  name={`Friend #${friend.friendId}`}
                  color="bg-primary" // Placeholder color
                />
                <div className="flex flex-col truncate">
                  <span className="font-semibold text-base-content truncate">Friend #{friend.friendId}</span>
                  <span className="text-xs text-base-content/60 truncate">{friend.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>

              {/* Right Side: Quick Actions & Dropdown (Gap shrinks on mobile/tablet implicitly via flex-between) */}
              <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                
                {/* Message Quick Action (Links to their DM) */}
                <Link 
                  href={`/messages/${friend.chatId}`} 
                  className="btn btn-circle btn-sm btn-ghost bg-base-200 text-base-content hover:bg-base-300 tooltip"
                  data-tip="Message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75c-1.63 0-3.17-.393-4.54-1.09l-4.14 1.38 1.38-4.14a9.712 9.712 0 0 1-1.09-4.54Z" />
                  </svg>
                </Link>

                {/* More Options Dropdown */}
                <div className="dropdown dropdown-end">
                  <label 
                    tabIndex={0} 
                    className="btn btn-circle btn-sm btn-ghost bg-base-200 text-base-content hover:bg-base-300 tooltip"
                    data-tip="More"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                    </svg>
                  </label>
                  <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow-lg bg-base-200 rounded-box w-48 mt-1 border border-base-300">
                    <li><a>View Profile</a></li>
                    <div className="divider my-0"></div>
                    <li><a className="text-error hover:bg-error/20 hover:text-error">Remove Friend</a></li>
                    <li><a className="text-error hover:bg-error/20 hover:text-error">Block User</a></li>
                  </ul>
                </div>

              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}