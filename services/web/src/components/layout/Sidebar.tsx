"use client";
import Link from "next/link";
import { Home, Newspaper, Users, BookOpen, Trophy, Settings, HelpCircle, Plus, ChevronDown, Star, X, FolderOpen, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [showRecent, setShowRecent] = useState(true);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const friends = [
    { name: "alex_km", login: "alkim", color: "from-blue-400 to-blue-600", online: true },
    { name: "priya_n", login: "pnair", color: "from-purple-400 to-purple-600", online: true },
    { name: "luca_r", login: "lricci", color: "from-green-400 to-green-600", online: false },
    { name: "sara_m", login: "smuell", color: "from-orange-400 to-orange-600", online: false },
    { name: "omar_k", login: "okhan", color: "from-pink-400 to-pink-600", online: true },
  ];

  const recentFriends = [
    { name: "javi_p", color: "from-cyan-400 to-cyan-600", online: true },
    { name: "mei_t", color: "from-indigo-400 to-indigo-600", online: false },
    { name: "felix_b", color: "from-teal-400 to-teal-600", online: true },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 mt-14 h-screen flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out z-100 ${
          isOpen ? 'w-86': 'w-0'
        }`}>
        <div className="h-full flex flex-col bg-white border-r border-gray-200">
          {/* Close button for mobile */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-200">
            <span className="text-sm font-semibold text-slate-700">Menu</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="Close sidebar"
            >
              <X size={20} className="text-slate-600" />
            </button>
          </div>
          
          <div className="p-3 border-b border-gray-200">
            <nav className="space-y-1">
              <Link onClick={onClose} href="/projects" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
                <Home size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
                <span className="group-hover:text-[#0f6f6b]">Home</span>
              </Link>
              <Link onClick={onClose} href="/messages" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
                <MessageCircle size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
                <span className="group-hover:text-[#0f6f6b]">Chat</span>
              </Link>
              <Link onClick={onClose} href="/friends" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
                <Users size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
                <span className="group-hover:text-[#0f6f6b]">Friends</span>
              </Link>
              <Link onClick={onClose} href="projects" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
                <Newspaper size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
                <span className="group-hover:text-[#0f6f6b]">Posts</span>
              </Link>
            </nav>
          </div>

          {/* Scrollable Content - dynamic height for online friends */}
          <div
            className="overflow-y-auto custom-scrollbar transition-all"
            style={{
              maxHeight: `${friends.filter(f => f.online).length * 80 + 80}px`, // auto-size to fit all, up to a max
              minHeight: '120px' // always show at least header and one name
            }}
          >
            <div className="pt-2 pb-6 px-4">
              {/* Section Header - sticky */}
              <div className="flex items-center justify-between px-2 pb-1 pt-0.5 mb-1 border-b border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Online
                </h3>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-bold text-green-600 border border-green-100">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  {friends.filter(f => f.online).length}
                </span>
              </div>

              <div className="space-y-1">
                {friends.filter(f => f.online).length === 0 ? (
                  <div className="py-10 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-medium text-slate-400 italic">The cluster is quiet...</p>
                  </div>
                ) : (
                  friends.filter(friend => friend.online).map((friend) => (
                    <a
                      key={friend.name}
                      href={`/profile/${friend.login}`}
                      className="group flex items-center gap-3 p-2 rounded-xl transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
                    >
                      {/* Avatar with a more sophisticated online indicator */}
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${friend.color} p-[2px]`}>
                          <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center overflow-hidden">
                            {/* Using a subtle pattern or initials */}
                            <span className={`text-xs font-bold bg-gradient-to-br ${friend.color} bg-clip-text text-transparent`}>
                              {friend.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-[#0f6f6b]">
                            {friend.name}
                          </p>
                        </div>
                        {/* Fake 'Status' - this makes it feel human */}
                        <p className="text-[11px] text-slate-400 truncate leading-none mt-0.5">
                          {friend.login} • <span className="text-slate-300">Just joined</span>
                        </p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Resources Section */}
          <div className="p-3 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Resources</h3>
            <div className="space-y-1">
              <a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm text-slate-700 hover:bg-gray-100 rounded-md transition">
                <BookOpen size={18} className="text-slate-600" />
                <span className="text-xs">About 42 overflow</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm text-slate-700 hover:bg-gray-100 rounded-md transition">
                <Trophy size={18} className="text-slate-600" />
                <span className="text-xs">Achievements</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm text-slate-700 hover:bg-gray-100 rounded-md transition">
                <HelpCircle size={18} className="text-slate-600" />
                <span className="text-xs">Help Center</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-2 py-1.5 text-sm text-slate-700 hover:bg-gray-100 rounded-md transition">
                <Settings size={18} className="text-slate-600" />
                <span className="text-xs">Settings</span>
              </a>
            </div>
          </div>
            
            {/* Footer */}
        <div className="p-1 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex flex-wrap gap-2">
                <a href="#" className="hover:underline">Privacy</a>
                <span>·</span>
                <a href="#" className="hover:underline">Terms</a>
              </div>
              <p className="text-gray-400">42 overflow, Inc. © 2026</p>
            </div>
          </div>
          
        </div>
        
          
      </aside>
    </>
  );
}