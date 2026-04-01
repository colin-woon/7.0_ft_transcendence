
"use client"
import { handleSendMessage } from '../lib/handleSendMessage'
  

import React, { useEffect, useState, useRef } from 'react'

import { ChatHeader } from './ChatHeader'
import { MessageBubble } from './MessageBubble'
// import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import { User } from '../models/types'

import { Message } from '../models/types'


const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: 'Hey there!',
    own: false,
    time: '09:41',
    status: 'read',
  },
  {
    id: '2',
    text: 'Hello! How are you?',
    own: true,
    time: '09:42',
    status: 'read',
  },
  {
    id: '3',
    text: 'I am good, thanks! And you?',
    own: false,
    time: '09:43',
    status: 'read',
  },
  {
    id: '4',
    text: 'Doing well! Ready for the project?',
    own: true,
    time: '09:45',
    status: 'read',
  },
  {
    id: '5',
    text: 'I have been reviewing the designs.',
    own: true,
    time: '09:45',
    status: 'read',
  },
  {
    id: '6',
    text: 'They look amazing! 🚀',
    own: true,
    time: '09:46',
    status: 'read',
  },
]
export function ChatArea() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  const onSendMessage = (text: string) => handleSendMessage(text, setMessages, setIsTyping)

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])
  return (
    <div className="flex flex-col h-[calc(100vh-var(--navbar-height))] bg-base-100 text-base-content relative z-20">
      {/* Background Pattern (Optional subtle texture) */}
      {/* <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '24px 24px',
      }}
      ></div> */}

      <div className="flex-1 px-4 sm:px-6 py-6 z-0 max-w-full outline-none focus:ring-2 focus:ring-primary/30">
        <div className="w-full flex-col">
          {/* Date Separator */}
          <div className="flex justify-center mb-6">
            <span className="bg-slate-200/60 text-slate-600 text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
              Today
            </span>
          </div>

          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1]
            const nextMsg = messages[index + 1]
            const isFirstInGroup = !prevMsg || prevMsg.own !== msg.own
            const isLastInGroup = !nextMsg || nextMsg.own !== msg.own
            // Show avatar only on the last message of a group for the other person
            const showAvatar = !msg.own && isLastInGroup
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                showAvatar={showAvatar}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
              />
            )
          })}

          {/* {isTyping && <TypingIndicator />} */}
          {/* <div ref={messagesEndRef} className="h-2" />
          <MessageInput onSendMessage={onSendMessage} /> */}
        </div>
      </div>
    </div>
  )
}
