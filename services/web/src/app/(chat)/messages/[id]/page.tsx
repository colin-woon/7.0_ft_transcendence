'use client';

import React, { use, useEffect } from 'react';
import { ChatHeader, ChatArea, ChatInput } from '@/features/chat/ui';
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
      <ChatHeader />
      <ChatArea />
      <ChatInput />
    </div>
  );
}