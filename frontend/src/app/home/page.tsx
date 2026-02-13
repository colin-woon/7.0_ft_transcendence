"use client";
import React, { useState, useEffect } from 'react';
import { Search, Download, Coins, MessageCircle, Bell, Plus, Menu, ChevronDown } from "lucide-react";


const sampleTopics = [
  {
    id: 1,
    title: "What's your favorite programming language and why?",
    author: "devmaster",
    avatar: "🧑‍💻",
    replies: 234,
    views: 1200,
    upvotes: 89,
    category: "Discussion",
    timestamp: "2h ago",
    preview: "I've been coding for 10 years and I keep coming back to Python for its simplicity and readability. The ecosystem is unmatched.",
    isHot: true,
    isPinned: false
  },
  {
    id: 2,
    title: "Help: Cannot deploy to production",
    author: "newbie_dev",
    avatar: "🤔",
    replies: 12,
    views: 156,
    upvotes: 5,
    category: "Help",
    timestamp: "4h ago",
    preview: "Getting a 500 error when trying to deploy my Next.js app to Vercel. Everything works fine locally but fails in production.",
    isHot: false,
    isPinned: false
  },
  {
    id: 3,
    title: "Show off: Built my first full-stack app!",
    author: "proudcoder",
    avatar: "🎉",
    replies: 45,
    views: 890,
    upvotes: 156,
    category: "Show & Tell",
    timestamp: "6h ago",
    preview: "After 6 months of learning, I finally built a complete task management app with React, Node.js, and PostgreSQL!",
    isHot: true,
    isPinned: true
  },
  {
    id: 4,
    title: "Best practices for database optimization?",
    author: "db_guru",
    avatar: "💾",
    replies: 78,
    views: 2100,
    upvotes: 234,
    category: "Tutorial",
    timestamp: "1d ago",
    preview: "Here are some tips I've learned from 15 years of working with databases - indexing strategies, query optimization, and more.",
    isHot: false,
    isPinned: false
  },
  {
    id: 5,
    title: "TypeScript vs JavaScript in 2025",
    author: "techwriter",
    avatar: "📝",
    replies: 312,
    views: 5600,
    upvotes: 421,
    category: "Discussion",
    timestamp: "1d ago",
    preview: "Let's settle this debate once and for all. Here's my take on when to use each and why TypeScript is becoming the default.",
    isHot: true,
    isPinned: false
  },
  {
    id: 6,
    title: "Remote work tips for developers",
    author: "remotepro",
    avatar: "🏠",
    replies: 67,
    views: 1800,
    upvotes: 143,
    category: "Career",
    timestamp: "2d ago",
    preview: "Working remotely for 5 years taught me these valuable lessons about productivity, communication, and work-life balance.",
    isHot: false,
    isPinned: false
  },
  {
    id: 7,
    title: "Learning roadmap for backend development",
    author: "mentor_dev",
    avatar: "🎓",
    replies: 189,
    views: 3400,
    upvotes: 298,
    category: "Tutorial",
    timestamp: "3d ago",
    preview: "A comprehensive guide for beginners wanting to become backend developers. Starting from basics to advanced concepts.",
    isHot: false,
    isPinned: false
  }
];

const category = ["All", "minishell", "inception", "philo", "Tutorial", "Career"];
const sortOptions = ["Best", "Hot", "New", "Top", "Rising"];

export default function Home()
{
	const [activeCategory, setActiveCategory] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({ categories: true });

	const [activeSort, setActiveSort] = useState("Hot");
	const [searchQuery, setSearchQuery] = useState("");

	//replace sample topics with your actual topics data
	const filteredTopics = sampleTopics.filter(topic => {
    const matchesCategory = activeCategory === "All" || topic.category === activeCategory;
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  	});

	const sortedTopics = [...filteredTopics].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    switch(activeSort) {
      case "Hot":
        return (b.upvotes + b.replies * 2) - (a.upvotes + a.replies * 2);
      case "Top":
        return b.upvotes - a.upvotes;
      case "New":
        return b.id - a.id;
      default:
        return 0;
    }
  });

  // Close sidebar on Escape key for better UX
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    if (isSidebarOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSidebarOpen]);

  const toggleSection = (key: string) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

    return (
      <div className="min-h-screen bg-[#f9f9f9] text-slate-900 flex flex-col">
        <header className="bg-white text-slate-900 sticky top-0 z-50 !border-b border-[#8EE7E3] w-full">
					<div className="max-w-7xl mx-auto px-4 py-1.5">
						<div className="flex items-center justify-between gap-4">
						
            {/* Left: Logo and reddit text */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-black/5 rounded-full transition"
                aria-label="Open sidebar"
              >
                <Menu size={20} className="text-slate-700" />
              </button>
              <button className="p-1.5 hover:bg-black/5 rounded-full transition">
              <svg className="w-6 h-6 text-[#8EE7E3]" viewBox="0 0 20 20" fill="currentColor">
								<circle cx="10" cy="10" r="2"/>
								<circle cx="4" cy="10" r="1.5"/>
								<circle cx="16" cy="10" r="1.5"/>
								<path d="M10 2C5.8 2 2.5 5.4 2.5 9.6c0 2.8 1.5 5.3 3.8 6.7-.2.6-.5 1.7-.2 2.6 0 0 1.4.2 3.5-1.2.7.2 1.5.3 2.4.3 4.2 0 7.5-3.4 7.5-7.6C17.5 5.4 14.2 2 10 2z"/>
							</svg>
							</button>
              <span className="text-slate-900 text-xl font-bold hidden sm:inline">42 overflow</span>
						</div>

						{/* Center: Search bar (Reddit style) */}
						<div className="flex-1 max-w-3xl">
							<div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
							<input
								type="text"
								placeholder="Search 42 overflow"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60 border border-gray-200"
							/>
							</div>
						</div>

						{/* Right: Action buttons */}
						<div className="flex items-center gap-1 flex-shrink-0">
							{/* Get App button - visible on desktop */}
              <button className="hidden md:flex items-center gap-1.5 border border-[#8EE7E3] hover:bg-[#8EE7E3]/15 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium transition">
							<Download size={16} />
							Get App
							</button>

							{/* Coins */}
              <button className="p-2 hover:bg-[#8EE7E3]/15 rounded-full text-slate-700 transition">
							<Coins size={20} />
							</button>

							{/* Chat */}
              <button className="p-2 hover:bg-[#8EE7E3]/15 rounded-full text-slate-700 transition relative">
							<MessageCircle size={20} />
							<span className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full"></span>
							</button>

							{/* Notifications */}
              <button className="p-2 hover:bg-[#8EE7E3]/15 rounded-full text-slate-700 transition relative">
							<Bell size={20} />
							<span className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full"></span>
							</button>

							{/* Create Post button */}
              <button className="hidden sm:flex items-center gap-1.5 bg-white text-[#0f6f6b] border border-[#8EE7E3] hover:bg-[#8EE7E3]/15 px-4 py-1.5 rounded-full text-sm font-bold transition">
							<Plus size={18} />
							Create
							</button>

							{/* User menu */}
              <button className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-[#8EE7E3]">
							U
							</button>
						</div>
						</div>
					</div>
					</header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/30 z-40"
                aria-label="Close categories overlay"
              />
            )}

            {/* Left Sidebar - Categories */}
            <aside
              id="categories-sidebar"
              className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-white border-r border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              aria-hidden={!isSidebarOpen}
            >
              <div className="h-full pt-20 px-4 overflow-y-auto">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Browse</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="inline-flex items-center text-[11px] uppercase tracking-wide text-slate-500 hover:text-[#0f6f6b]"
                    aria-label="Close sidebar"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Explore section */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">Explore</div>
                    <nav className="bg-white border border-gray-200">
                      {['Home', 'Popular', 'All Posts'].map((item) => (
                        <button
                          key={item}
                          onClick={() => setIsSidebarOpen(false)}
                          className="w-full text-left pl-4 pr-3 py-2 text-sm transition border-b border-gray-100 last:border-b-0 hover:bg-gray-50 text-slate-700"
                        >
                          {item}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Categories (collapsible) */}
                  <div>
                    <button
                      onClick={() => toggleSection('categories')}
                      className="flex w-full items-center justify-between text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2 hover:text-[#0f6f6b]"
                      aria-expanded={sectionsOpen['categories']}
                      aria-controls="sidebar-categories"
                    >
                      <span>Categories</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${sectionsOpen['categories'] ? 'rotate-0' : '-rotate-90'}`}
                      />
                    </button>
                    {sectionsOpen['categories'] && (
                      <nav id="sidebar-categories" className="bg-white border border-gray-200">
                        {category.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`relative w-full text-left pl-4 pr-3 py-2 text-sm transition border-b border-gray-100 last:border-b-0 ${
                              activeCategory === cat
                                ? 'bg-[#8EE7E3]/10 text-[#0f6f6b] font-medium'
                                : 'hover:bg-gray-50 text-slate-700'
                            }`}
                          >
                            <span
                              className={`absolute left-0 top-0 h-full w-1 ${
                                activeCategory === cat ? 'bg-[#8EE7E3]' : 'bg-transparent'
                              }`}
                            />
                            {cat}
                          </button>
                        ))}
                      </nav>
                    )}
                  </div>

                  {/* About / Other */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">About</div>
                    <nav className="bg-white border border-gray-200">
                      {['About Us', 'Help Center', 'Settings'].map((item) => (
                        <button
                          key={item}
                          onClick={() => setIsSidebarOpen(false)}
                          className="w-full text-left pl-4 pr-3 py-2 text-sm transition border-b border-gray-100 last:border-b-0 hover:bg-gray-50 text-slate-700"
                        >
                          {item}
                        </button>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Feed */}
            <div className="flex-1 space-y-4">

              {/* Sort Options */}
              <div className="bg-white rounded-lg border border-gray-200 p-2">
                <div className="flex gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setActiveSort(option)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        activeSort === option
                          ? 'bg-[#8EE7E3]/20 text-[#0f6f6b]'
                          : 'hover:bg-gray-100 text-slate-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics List - Scrollable */}
              <div className="space-y-3">
                {sortedTopics.map((topic) => (
                  <div
                    key={topic.id}
                    className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition cursor-pointer"
                  >
                    <div className="p-4">
                      <div className="flex gap-3">
                        
                        {/* Vote Section */}
                        <div className="flex flex-col items-center gap-1 text-xs">
                          <button className="hover:bg-gray-100 rounded p-1">▲</button>
                          <span className="font-medium">{topic.upvotes}</span>
                          <button className="hover:bg-gray-100 rounded p-1">▼</button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {topic.isPinned && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Pinned
                              </span>
                            )}
                            {topic.isHot && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                🔥 Hot
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{topic.category}</span>
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-1 hover:text-[#0f6f6b]">
                            {topic.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {topic.preview}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              {topic.avatar} {topic.author}
                            </span>
                            <span>{topic.timestamp}</span>
                            <span>💬 {topic.replies} replies</span>
                            <span>👁 {topic.views} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
			</div>
	  )
}