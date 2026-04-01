import React from 'react'
import { Phone, Video, MoreVertical, Search } from 'lucide-react'
import { User } from '../models/types'
interface ChatHeaderProps {
  user: User
}
export function ChatHeader({ user }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-100/90 text-base-content backdrop-blur-xl z-10">
      <div className="flex items-center group cursor-pointer min-w-0">
        <div className="relative mr-4">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-content font-bold shadow-sm transition-transform group-hover:scale-105">
            {user.initials}
          </div>
          {user.online && (
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success border-2 border-base-100 rounded-full shadow-sm"></div>
          )}
        </div>
        <div>
          <div className="font-semibold text-base-content text-lg leading-tight group-hover:text-primary transition-colors truncate whitespace-nowrap">
            {user.name}
          </div>
          <div className="text-xs font-medium text-success flex items-center gap-1.5 mt-0.5">
            Online
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 text-base-content/60">
        <button className="p-2.5 hover:bg-base-300 hover:text-primary rounded-full transition-all">
          {/* <Phone className="w-5 h-5" /> */}
        </button>
        <button className="p-2.5 hover:bg-base-300 hover:text-primary rounded-full transition-all">
          {/* <Video className="w-5 h-5" /> */}
        </button>
        <div className="w-px h-6 bg-base-300 mx-1 hidden sm:block"></div>
        <button className="p-2.5 hover:bg-base-300 hover:text-primary rounded-full transition-all hidden sm:block">
          {/* <Search className="w-5 h-5" /> */}
        </button>
        <button className="p-2.5 hover:bg-base-300 hover:text-primary rounded-full transition-all">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
