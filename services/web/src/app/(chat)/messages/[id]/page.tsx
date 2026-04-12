'use client';

import React, { use, useEffect } from 'react';
import { MessageArea, MessageInput } from '@/features/chat/ui';
import { useChatActions } from '@/features/chat/models';

export default function ActiveChatPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const unwrappedParams = use(params);
  const { setCurrentChatSessionId } = useChatActions();

  useEffect(() => {
    if (unwrappedParams.id) {
      setCurrentChatSessionId(unwrappedParams.id);
    }
  }, [unwrappedParams.id, setCurrentChatSessionId]);

  return (
    <div className="flex flex-col h-full w-full bg-base-100 overflow-hidden">
      
      {/* WhatsApp-Style Header */}
      <div className="h-[73px] border-b border-base-300 flex items-center px-4 md:px-6 bg-base-100/95 backdrop-blur-md z-10 shadow-sm shrink-0">
        <div className="md:hidden mr-2">
          <button 
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => window.history.back()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        </div>
        <div className="avatar mr-4">
          <div className="w-11 h-11 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 bg-neutral text-neutral-content flex items-center justify-center font-bold">
            <span className="text-xl">#</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="font-semibold text-lg leading-tight">Active Conversation</div>
          <div className="text-xs text-success font-medium">Online</div>
        </div>
      </div>

      <MessageArea />

      <MessageInput />
    </div>
  );
}