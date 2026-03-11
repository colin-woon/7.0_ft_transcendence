"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAppShell } from '../AppShellContext';


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
  const { searchQuery } = useAppShell()
	const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
	const [activeSort, setActiveSort] = useState("Hot");

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

    return (
      <div className="max-w-5xl mx-auto">
            {/* Sort + View */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-slate-500">Sort by</span>
                <select
                  value={activeSort}
                  onChange={(e) => setActiveSort(e.target.value)}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
                >
                  {sortOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">View</span>
                  <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`px-3 py-1.5 text-sm transition ${
                        viewMode === 'card'
                          ? 'bg-[#8EE7E3]/20 text-[#0f6f6b]'
                          : 'bg-white text-slate-700 hover:bg-gray-50'
                      }`}
                    >
                      Card
                    </button>
                    <button
                      onClick={() => setViewMode('compact')}
                      className={`px-3 py-1.5 text-sm transition ${
                        viewMode === 'compact'
                          ? 'bg-[#8EE7E3]/20 text-[#0f6f6b]'
                          : 'bg-white text-slate-700 hover:bg-gray-50'
                      }`}
                    >
                      Compact
                    </button>
                  </div>
                </div>
              </div>

              {/* Topics List - Scrollable */}
              <div className="space-y-3">
                {sortedTopics.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#8EE7E3]/20 text-[#0f6f6b] flex items-center justify-center text-xl font-bold mx-auto mb-4">
                      0
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">No threads yet</h3>
                    <p className="text-sm text-slate-600 mb-5">
                      Try a different search, or be the first to start a thread.
                    </p>
                    <a
                      href="/create"
                      className="inline-flex items-center justify-center rounded-full bg-[#0f6f6b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0c5d5a]"
                    >
                      Create a thread
                    </a>
                  </div>
                ) : (
                  sortedTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className={`bg-white border border-gray-200 hover:border-gray-300 transition cursor-pointer ${
                        viewMode === 'card' ? 'rounded-lg' : 'rounded-md'
                      }`}
                    >
                      <div className={viewMode === 'card' ? 'p-4' : 'px-3 py-2'}>
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
                            
                            <h3 className={`font-semibold hover:text-[#0f6f6b] ${
                              viewMode === 'card' ? 'text-lg mb-1' : 'text-base mb-0.5'
                            }`}>
                              {topic.title}
                            </h3>
                            
                            {viewMode === 'card' && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {topic.preview}
                              </p>
                            )}

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
                  ))
                )}
              </div>
      </div>
    )
}