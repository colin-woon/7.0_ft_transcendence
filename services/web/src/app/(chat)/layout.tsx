import React from 'react';
import ChatSidebar from '@/features/chat/ui/ChatSidebar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-base-100">
      
      {/* 
        SECONDARY SIDEBAR
        Desktop: Fixed width 72 (18rem), visible
        Mobile: Hidden by default (we can introduce a DaisyUI drawer later for mobile toggling)
      */}
      <aside className="hidden md:flex flex-col w-72 bg-base-200 border-r border-base-300 shrink-0 h-full overflow-y-auto">
        <ChatSidebar />
      </aside>

      {/* 
        MAIN CONTENT AREA
        Takes up the remaining space using flex-1.
        Renders the active chat window or the friends list.
      */}
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative bg-base-100">
        {children}
      </main>

    </div>
  );
}