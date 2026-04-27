'use client';

import React, { use, useEffect } from 'react';
import { ChatHeader, ChatArea, ChatInput } from '@/features/chat/ui';
import { useChatActions, useCurrentChatSession } from '@/features/chat/models';

export default function ActiveChatPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const unwrappedParams = use(params);
  const { setCurrentChatSessionId, fetchChatHistory } = useChatActions();
  const { isLoadingChatHistory, messages } = useCurrentChatSession();

  useEffect(() => {
    if (unwrappedParams.id) {
      setCurrentChatSessionId(unwrappedParams.id);
      fetchChatHistory(unwrappedParams.id);
    }
  }, [unwrappedParams.id, setCurrentChatSessionId, fetchChatHistory]);

  if (isLoadingChatHistory) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );
}
  return (
    <div className="flex flex-col h-full w-full bg-base-100 overflow-hidden">
      <ChatHeader />
      <ChatArea />
      <ChatInput />
    </div>
  );
}