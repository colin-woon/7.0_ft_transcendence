'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AvatarWithStatus } from '@/features/chat/ui';

// Mock data based on your provided screenshot
const MOCK_CHATS = [
  { id: '1', name: 'Jane Doe', initials: 'JD', color: 'bg-emerald-500', isOnline: true, unread: 0 },
  { id: '2', name: 'Design Team', initials: 'DT', color: 'bg-teal-500', isOnline: false, unread: 3 },
  { id: '3', name: 'Alex Smith', initials: 'AS', color: 'bg-cyan-600', isOnline: false, unread: 0 },
  { id: '4', name: 'Marketing Sync', initials: 'MS', color: 'bg-sky-500', isOnline: false, unread: 0 },
  { id: '5', name: 'Dev Squad', initials: 'DS', color: 'bg-indigo-500', isOnline: true, unread: 1 },
];

export default function ChatSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-base-200 text-base-content w-full">
      {/* Top Nav (Friends, Create Group) */}
      <div className="px-2 pt-2 pb-4">
        <ul className="menu menu-sm w-full p-0 gap-1">
          <li>
            <Link 
              href="/friends" 
              className={`flex items-center gap-3 py-3 rounded-md ${pathname === '/friends' ? 'bg-base-300 text font-semibold' : 'text-base-content/80 hover:bg-base-300/50'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              Friends
            </Link>
          </li>
          <li>
            <button className="flex items-center gap-3 py-3 rounded-md text-base-content/80 hover:bg-base-300/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Group
            </button>
          </li>
        </ul>
      </div>

      {/* DM List Divider */}
      <div className="px-4 pb-2 flex justify-between items-center group">
        <span className="text-xs font-bold text-base-content/50 uppercase tracking-widest hover:text-base-content transition-colors cursor-default">
          Direct Messages
        </span>
        <button className="text-base-content/50 hover:text-base-content opacity-0 group-hover:opacity-100 transition-opacity">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Scrollable Chat List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-1 custom-scrollbar">
        {MOCK_CHATS.map((chat) => {
          const isActive = pathname === `/messages/${chat.id}`;
          
          return (
            <Link 
              key={chat.id} 
              href={`/messages/${chat.id}`}
              className={`flex items-center gap-3 px-2 py-2 w-full rounded-md group transition-colors ${
                isActive ? 'bg-base-300 text-base-content' : 'hover:bg-base-300/50 text-base-content/70'
              }`}
            >
              {/* Avatar with unread/online indicator */}
              <AvatarWithStatus 
                userId={parseInt(chat.id)} 
                chatId={chat.id} 
                name={chat.name} 
                initials={chat.initials} 
                color={chat.color} 
              />

              {/* Chat Name */}
              <div className="flex-1 truncate">
                <span className={`text-sm truncate block ${isActive || chat.unread > 0 ? 'font-bold' : 'font-medium'}`}>
                  {chat.name}
                </span>
                {/* Optional subtitles like "Typing..." or small preview could go here */}
              </div>

              {/* Close/Hide Button on Hover (Discord style) */}
              <button 
                className="opacity-0 group-hover:opacity-100 btn btn-xs btn-ghost btn-circle text-base-content/50 hover:text-base-content"
                onClick={(e) => {
                  e.preventDefault(); 
                  // Close chat action here
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}