"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ChevronUp, 
  ChevronDown, 
  MessageSquare, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal
} from "lucide-react";
import { projects } from "../../models/projects";

export default function ProjectForumPage() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);
  const [activeSort, setActiveSort] = useState("Hot");

  if (!project) return null; // Logic for 404 handled here

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">

      <main className="mx-auto max-w-5xl px-6 py-10">
        
        {/* 2. Page Header: Professional & Clean */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{project.name}</h1>
            <p className="mt-2 max-w-2xl text-slate-500 leading-relaxed text-sm">
              {project.description}
            </p>
          </div>
          
        </header>

        {/* 3. The "GitHub-Style" Discussion List */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_15px_-5px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
          
          {/* Toolbar: Neutral and Functional */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-5 py-3">
            <div className="flex items-center gap-3">
                {/* Label */}
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Sort by:
                </span>
                
                {/* Custom Styled Select Container */}
                <div className="relative group">
                    <select
                      value={activeSort}
                      onChange={(e) => setActiveSort(e.target.value)}
                      className="appearance-none cursor-pointer rounded-full border border-slate-300 bg-white pr-9 pl-4 py-1.5 text-xs font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-black/10">
                      {["Hot", "New", "Top"].map((sort) => (
                        <option key={sort} value={sort} className="bg-white text-slate-700">
                          {sort}
                        </option>
                      ))}
                    </select>

                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 group-hover:text-slate-700 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
              </div>
              <Link href={`/create`} className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-transparent px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors duration-300 hover:bg-slate-700 hover:text-white active:scale-95">
                   <Plus size={14} />
                    Create Post
              </Link>
              </div>

          {/* Posts Feed */}
          <div className="divide-y divide-slate-100">
            {project.posts.map((post) => (
              <div key={post.id} className="group flex items-start gap-4 p-5 transition-colors hover:bg-slate-50">
                
                {/* Minimal Voting Sidebar */}
                <div className="flex flex-col items-center gap-1 w-10 shrink-0">
                  <button className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-teal-600">
                    <ChevronUp size={20} />
                  </button>
                  <span className="text-xs font-bold text-slate-700">{post.upvotes}</span>
                  <button className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-red-500">
                    <ChevronDown size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">

                  <h3 className="text-base md:text-lg font-semibold tracking-tight text-slate-900 leading-snug transition-colors mb-3">
                    {post.title}
                  </h3>

                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {post.preview}
                  </p>

                  {/* Metadata: High Contrast Secondary Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold border border-white outline outline-1 outline-slate-200">
                          {post.author.charAt(0)}
                        </div>
                        <span className="text-slate-600">{post.author}</span>
                      </div>
                      <span>•</span>
                      <span>{post.timestamp}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MessageSquare size={12} className="text-slate-300" />
                        <span>{post.replies} replies</span>
                      </div>
                    </div>
                    
                    <button className="text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-slate-400">
          Showing {project.posts.length} discussions. You've reached the end.
        </p>
      </main>
    </div>
  );
}