import React from 'react'
import { Check, CheckCheck } from 'lucide-react'
import { Message } from '../models/types'
interface MessageBubbleProps {
  message: Message
  showAvatar: boolean
  isLastInGroup: boolean
  isFirstInGroup: boolean
}
export function MessageBubble({
  message,
  showAvatar,
  isLastInGroup,
  isFirstInGroup,
}: MessageBubbleProps) {
  const { text, own, time, status } = message
  // Determine border radius based on grouping
  const borderRadius = own
    ? `rounded-2xl ${isFirstInGroup ? 'rounded-tr-sm' : ''} ${isLastInGroup ? 'rounded-br-sm' : ''} ${!isFirstInGroup && !isLastInGroup ? 'rounded-r-sm' : ''}`
    : `rounded-2xl ${isFirstInGroup ? 'rounded-tl-sm' : ''} ${isLastInGroup ? 'rounded-bl-sm' : ''} ${!isFirstInGroup && !isLastInGroup ? 'rounded-l-sm' : ''}`
  return (
    <div
      className={`flex ${own ? 'justify-end' : 'justify-start'} mb-${isLastInGroup ? '4' : '1'} group`}
    >
      {!own && (
        <div className="w-8 flex-shrink-0 mr-2 flex flex-col justify-end">
          {showAvatar && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content font-bold text-xs shadow-sm">
              JD
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col max-w-[75%]">
        <div
          className={`relative px-4 py-2.5 text-[15px] leading-relaxed shadow-sm transition-all duration-200 ${borderRadius} ${own ? 'bg-primary/80 text-primary-content hover:bg-primary/90' : 'bg-base-200/80 text-base-content border border-base-300 hover:bg-base-300/60'}`}
        >
          <span>{text}</span>

          {/* Timestamp and Status */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 -mb-1 ${own ? 'text-primary/70' : 'text-base-content/60'}`}
          >
            <span className="text-[10px] font-medium">{time}</span>
            {own && status === 'read' && <CheckCheck className="w-3.5 h-3.5" />}
            {own && status === 'sent' && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>
    </div>
  )
}
