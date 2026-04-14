import { useState } from 'react'
import { Search, Edit, MoreVertical, Users, ChevronDown } from 'lucide-react'



export function Sidebar() {
  const [showGroups, setShowGroups] = useState(true)

   const groups = [
    {
      id: 1,
      name: 'Design Team',
      message: 'Can we review the new assets?',
      time: '08:22',
      unread: 3,
      members: 5,
    },
    {
      id: 2,
      name: 'Marketing Sync',
      message: 'Meeting notes attached.',
      time: 'Yesterday',
      unread: 0,
      members: 8,
    },
    {
      id: 3,
      name: 'Dev Squad',
      message: 'PR is ready for review.',
      time: 'Mon',
      unread: 1,
      members: 4,
    },
  ]
  const recentChats = [
    {
      id: 1,
      name: 'Jane Doe',
      message: 'They look amazing! 🚀',
      time: '09:46',
      unread: 0,
      active: true,
    },
    {
      id: 2,
      name: 'Design Team',
      message: 'Can we review the new assets?',
      time: '08:22',
      unread: 3,
      active: false,
    },
    {
      id: 3,
      name: 'Alex Smith',
      message: 'Sounds good to me.',
      time: 'Yesterday',
      unread: 0,
      active: false,
    },
    {
      id: 4,
      name: 'Marketing Sync',
      message: 'Meeting notes attached.',
      time: 'Yesterday',
      unread: 0,
      active: false,
    },
    
  ]
  return (
    <div className="flex flex-col h-[calc(100vh-var(--navbar-height))] bg-base-200 text-base-content backdrop-blur-xl border-r border-base-300 z-40 w-86 min-w-0">
      {/* Sidebar Header */}
      <div className="px-4 py-5 border-b border-base-300 flex items-center justify-between">
        <h2 className="text-xl font-bold text-base-content">Chats</h2>
          {/* <button className="p-2 hover:bg-base-300 rounded-full transition-colors">
          </button>
          <button className="p-2 hover:bg-base-300 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button> */}
      </div>

    <div className="flex-1 overflow-y-auto flex-shrink-0">
      {/* Search Bar */}
      {/* <div className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full bg-slate-100 text-sm text-slate-900 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div> */}

      {/* Groups and Individuals in one scrollable container */}

        {/* Divider and Individuals Header */}
        <div className="border-t border-base-300 my-2" />
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-widest">
            Individuals
          </span>
        </div>
        {/* Chat List */}
        {recentChats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${chat.active ? 'bg-primary/10' : 'hover:bg-base-300'}`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-content font-semibold shadow-sm">
                {chat.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              {chat.active && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-success border-2 border-base-100 rounded-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="text-sm font-semibold text-base-content truncate">
                  {chat.name}
                </h3>
                <span
                  className={`text-xs ${chat.unread ? 'text-primary font-medium' : 'text-base-content/50'}`}
                >
                  {chat.time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                {/* <p
                  className={`text-sm truncate ${chat.unread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}
                >
                  {chat.message}
                </p>
                {chat.unread > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {chat.unread}
                  </span>
                )} */}
              </div>
            </div>
          </div>
        ))}
        {/* Groups Section (non-collapsible, plus sign in header) */}
        <div className="mt-2">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-widest">
              Groups
            </span>
            <button className="p-1 rounded-full hover:bg-base-300 transition-colors" aria-label="Create group">
              <span className="text-xl text-primary">+</span>
            </button>
          </div>
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-base-300 transition-colors"
            >
              {/* Group avatar — purple gradient to distinguish from DMs */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-secondary-content shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                {group.unread > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary-content">{group.unread}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-sm font-semibold text-base-content truncate">
                    {group.name}
                  </h3>
                  <span className={`text-xs ${group.unread ? 'text-primary font-medium' : 'text-base-content/50'}`}>
                    {group.time}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  {/* <p className={`text-sm truncate ${group.unread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                    {group.message}
                  </p> */}
                  {/* Member count */}
                  <span className="ml-2 text-[10px] text-base-content/50 flex-shrink-0">
                    {group.members} members
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

