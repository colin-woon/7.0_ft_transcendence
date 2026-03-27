// This file has been moved to src/features/chat/ui/ChatSidebar.tsx

// The ChatSidebar component has been removed from this location.
import { useState } from "react";
import { Users, Search, Settings, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface Contact {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  online: boolean;
  lastMessage?: string;
  unread?: number;
}

const contacts: Contact[] = [
  { id: "1", name: "Alex Kim", handle: "alex_km", avatar: "AK", online: true, lastMessage: "Doing well! Ready for the project?", unread: 0 },
  { id: "2", name: "Priya Nair", handle: "priya_n", avatar: "PN", online: true, lastMessage: "Sure, send me the designs", unread: 3 },
  { id: "3", name: "Luca Rossi", handle: "luca_r", avatar: "LR", online: false, lastMessage: "Talk later!", unread: 0 },
  { id: "4", name: "Maya Chen", handle: "maya_c", avatar: "MC", online: true, lastMessage: "The API is ready 🚀", unread: 1 },
  { id: "5", name: "Jordan Lee", handle: "jordan_l", avatar: "JL", online: false, lastMessage: "Thanks for the help", unread: 0 },
];

interface Group {
  id: string;
  name: string;
  members: number;
  unread?: number;
}

const groups: Group[] = [
  { id: "g1", name: "Design Team", members: 5, unread: 12 },
  { id: "g2", name: "Project Alpha", members: 8, unread: 3 },
  { id: "g3", name: "Weekend Plans", members: 4 },
];

interface ChatSidebarProps {
  activeContactId: string;
  onSelectContact: (id: string) => void;
}

export default function ChatSidebar({ activeContactId, onSelectContact }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 h-full bg-chat-sidebar flex flex-col border-r border-chat-sidebar-border">
      {/* Logo / Brand */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold text-chat-sidebar-bright tracking-tight">
          Chatly
        </h1>
        <button className="p-1.5 rounded-lg hover:bg-chat-sidebar-hover transition-colors">
          <Settings className="w-4 h-4 text-chat-sidebar-foreground" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-chat-sidebar-foreground/60" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-chat-sidebar-hover text-chat-sidebar-bright placeholder:text-chat-sidebar-foreground/50 text-sm rounded-lg pl-9 pr-3 py-2 border-none outline-none focus:ring-1 focus:ring-chat-sidebar-active transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll px-2">
        {/* Groups */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-chat-sidebar-foreground/60">
              Groups
            </span>
            <button className="p-0.5 rounded hover:bg-chat-sidebar-hover transition-colors">
              <Plus className="w-3.5 h-3.5 text-chat-sidebar-foreground/60" />
            </button>
          </div>
          {groups.map((group) => (
            <button
              key={group.id}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-chat-sidebar-foreground hover:bg-chat-sidebar-hover hover:text-chat-sidebar-bright transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-chat-sidebar-hover flex items-center justify-center flex-shrink-0 group-hover:bg-chat-sidebar-active/30">
                <Users className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="block truncate">{group.name}</span>
                <span className="text-[11px] opacity-50">{group.members} members</span>
              </div>
              {group.unread && (
                <span className="bg-chat-sidebar-active text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {group.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Direct Messages */}
        <div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-chat-sidebar-foreground/60">
              Direct Messages
            </span>
            <button className="p-0.5 rounded hover:bg-chat-sidebar-hover transition-colors">
              <Plus className="w-3.5 h-3.5 text-chat-sidebar-foreground/60" />
            </button>
          </div>
          {filteredContacts.map((contact) => (
            <motion.button
              key={contact.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectContact(contact.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                activeContactId === contact.id
                  ? "bg-chat-sidebar-active/20 text-chat-sidebar-bright"
                  : "text-chat-sidebar-foreground hover:bg-chat-sidebar-hover hover:text-chat-sidebar-bright"
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                  activeContactId === contact.id
                    ? "bg-chat-sidebar-active text-primary-foreground"
                    : "bg-chat-sidebar-hover text-chat-sidebar-bright"
                }`}>
                  {contact.avatar}
                </div>
                {contact.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-online rounded-full border-2 border-chat-sidebar" />
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">@{contact.handle}</span>
                  {contact.unread ? (
                    <span className="bg-chat-sidebar-active text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {contact.unread}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs truncate opacity-60 mt-0.5">{contact.lastMessage}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* User footer */}
      <div className="px-4 py-3 border-t border-chat-sidebar-border flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-chat-sidebar-active flex items-center justify-center text-xs font-semibold text-primary-foreground">
            ME
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-online rounded-full border-2 border-chat-sidebar" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-chat-sidebar-bright truncate">You</p>
          <p className="text-[11px] text-chat-sidebar-foreground/60">Online</p>
        </div>
      </div>
    </div>
  );
}
