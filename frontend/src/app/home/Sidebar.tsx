"use client";
import { Home, TrendingUp, Users, BookOpen, Trophy, Settings, HelpCircle, Plus, ChevronDown, Star, X } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [showRecent, setShowRecent] = useState(true);

  const communities = [
    { name: "r/minishell", members: "12.5k", icon: "🐚", color: "from-blue-400 to-blue-600" },
    { name: "r/inception", members: "8.2k", icon: "🐳", color: "from-purple-400 to-purple-600" },
    { name: "r/philo", members: "15.1k", icon: "🍝", color: "from-green-400 to-green-600" },
    { name: "r/webserv", members: "6.8k", icon: "🌐", color: "from-orange-400 to-orange-600" },
    { name: "r/ft_transcendence", members: "4.3k", icon: "🎮", color: "from-pink-400 to-pink-600" },
  ];

  const recentCommunities = [
    { name: "r/42network", icon: "🏫", color: "from-cyan-400 to-cyan-600" },
    { name: "r/programming", icon: "💻", color: "from-indigo-400 to-indigo-600" },
    { name: "r/learnprogramming", icon: "📚", color: "from-teal-400 to-teal-600" },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`w-64 fixed top-[60px] bottom-0 z-50 flex-shrink-0 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
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
        
        {/* Navigation Links */}
        <div className="p-3 border-b border-gray-200">
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
              <Home size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
              <span className="group-hover:text-[#0f6f6b]">Home</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
              <TrendingUp size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
              <span className="group-hover:text-[#0f6f6b]">Popular</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#8EE7E3]/10 rounded-lg transition group">
              <Users size={20} className="text-slate-600 group-hover:text-[#0f6f6b]" />
              <span className="group-hover:text-[#0f6f6b]">All Communities</span>
            </a>
          </nav>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Recent Communities */}
          <div className="p-3 border-b border-gray-200">
            <button 
              onClick={() => setShowRecent(!showRecent)}
              className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition"
            >
              <span>Recent</span>
              <ChevronDown size={14} className={`transform transition-transform ${showRecent ? 'rotate-180' : ''}`} />
            </button>
            
            {showRecent && (
              <div className="mt-2 space-y-1">
                {recentCommunities.map((community) => (
                  <a
                    key={community.name}
                    href="#"
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-700 hover:bg-[#8EE7E3]/10 rounded-md transition group"
                  >
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${community.color} flex items-center justify-center text-xs flex-shrink-0`}>
                      {community.icon}
                    </div>
                    <span className="truncate text-xs group-hover:text-[#0f6f6b]">{community.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Communities Section */}
          <div className="p-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Communities</h3>
              <button className="p-1 hover:bg-gray-100 rounded transition">
                <Plus size={14} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-1">
              {communities.map((community) => (
                <a
                  key={community.name}
                  href="#"
                  className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 hover:bg-[#8EE7E3]/10 rounded-md transition group"
                >
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${community.color} flex items-center justify-center text-sm flex-shrink-0`}>
                    {community.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-[#0f6f6b]">{community.name}</div>
                    <div className="text-xs text-gray-500">{community.members} members</div>
                  </div>
                </a>
              ))}
            </div>

            {/* Create Community Button */}
            <button className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-[#0f6f6b] border border-[#8EE7E3] hover:bg-[#8EE7E3]/10 rounded-full transition">
              <Plus size={16} />
              Create Community
            </button>
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
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
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