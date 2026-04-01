
"use client"
import React, { useState, useRef } from 'react'
import { Sidebar } from '@/features/chat/ui/ChatSidebar'
import { ChatArea } from '@/features/chat/ui/ChatArea'
import { ChatHeader } from '@/features/chat/ui/ChatHeader'
import MessageInput from '@/features/chat/ui/MessageInput'

interface MessageInputProps {
  onSendMessage: (text: string) => void
}



function ChatApp() {
  return (
    <div className="flex outline-hidden overflow-hidden h-[calc(100vh-var(--navbar-height))] mt-10">
      {/* Fixed sidebar for desktop */}
        <Sidebar />
        {/* Fixed header for desktop */}
        <div className="flex-1 flex flex-col h-[calc(100vh-var(--navbar-height))] outline-none outline-hidden">
          <ChatHeader user={{ initials: "JD", name: "Jane Doe", online: true }} />
      {/* Main Chat Area */}
            <div className="flex-1 overflow-y-auto">
              <ChatArea />
            </div>
            <div className="">
              <MessageInput onSendMessage={(text) => console.log(text)} />
            </div>
      </div>
    </div>
  )
}



export default ChatApp;