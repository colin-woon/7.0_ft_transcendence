'use client';

import React, { use } from 'react';
import { ChatArea } from '@/features/chat/ui/ChatArea';

// Note: In Next.js App Router, `params` should be unwrapped via `use()` or awaited if needed dynamically.
// For page props, Next.js 13+ passes params as a Promise.
export default function ActiveChatPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const unwrappedParams = use(params);

  // In a real app, you would fetch the user/chat data based on unwrappedParams.id here.
  // For the UI redesign step, we pass placeholder or fetched data down to your ChatArea component.
  
  return (
    <div className="flex flex-col h-full w-full bg-base-100">
      
      {/* 
        Discord-Style Chat Header for Mobile (Drawer Toggle)
        On mobile, the layout hides the left sidebar. This header includes a back button 
        to return to the secondary sidebar (Friends/DMs list) on smaller screens.
      */}
      <div className="md:hidden flex items-center px-4 h-14 border-b border-base-300 w-full shrink-0">
        <button 
          className="btn btn-ghost btn-sm btn-circle mr-2"
          onClick={() => window.history.back()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="font-bold truncate">Back to Chats</span>
      </div>

      {/* 
        The main ChatArea container.
        This assumes ChatArea fills height natively or requires flex-grow.
      */}
      <div className="flex-1 overflow-hidden relative">
        {/* <ChatArea chatId={unwrappedParams.id} /> */}
        <ChatArea />
      </div>

    </div>
  );
}