import React, { useEffect, useState, useRef } from 'react'
import { Paperclip, Smile, Mic, Send } from 'lucide-react'
interface MessageInputProps {
  onSendMessage: (text: string) => void
}
export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input.trim())
      setInput('')
      inputRef.current?.focus()
    }
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-4 sm:px-6 py-4 border-t border-base-300 bg-base-100/90 backdrop-blur-xl"
    >
      <div className="flex items-center gap-1 sm:gap-2 text-base-content/50">
        <button
          type="button"
          className="p-2 hover:bg-base-200 hover:text-primary rounded-full transition-all"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center">
        <button
          type="button"
          className="absolute left-3 p-1.5 text-base-content/50 hover:text-primary transition-colors"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          className="w-full bg-base-200 border border-transparent rounded-full pl-11 pr-11 py-3 text-[15px] text-base-content placeholder:text-base-content/50 focus:outline-none focus:bg-base-100 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 p-1.5 text-base-content/50 hover:text-primary transition-colors"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

      <button
        type="submit"
        disabled={!input.trim()}
        className={`ml-1 p-3 rounded-full flex items-center justify-center transition-all shadow-sm ${input.trim() ? 'bg-primary text-primary-content hover:bg-primary/80 hover:shadow-md hover:-translate-y-0.5' : 'bg-base-200 text-base-content/50 cursor-not-allowed'}`}
      >
        <Send className="w-5 h-5 ml-0.5" />
      </button>
    </form>
  )
}
