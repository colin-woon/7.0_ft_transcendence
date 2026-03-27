"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Zap, Clock, Users, Star, MessageSquare, Plus } from "lucide-react";
import type { Project } from "../../models/projects";
import PostVoteButtons from '../wesley_posts/components/PostVoteButtons';
import ProjectCard from "./ProjectCard";

const sortOptions = ["New", "Top"];

export default function ProjectForumPage({ project }: { project: Project }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get('sort') === 'New' ? 'New' : 'Top';
  const [viewMode, setViewMode] = useState<"card" | "compact">("card");

  const handleSortChange = (sort: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('sort', sort);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  return (
      <div className="min-h-screen bg-[#f9f9f9]">
        {/* Back nav */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#0f6f6b] transition-colors"
          >
            <ArrowLeft size={15} />
            All Projects
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

          {/* ── Project description card ── */}
          <ProjectCard project={project} />

          {/* ── Forum section ── */}
          <div>
            {/* Toolbar */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Sort by</span>
                <select
                  value={activeSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
                >
                  {sortOptions.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                  {(["card", "compact"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 text-sm transition capitalize ${
                        viewMode === mode
                          ? "bg-[#8EE7E3]/20 text-[#0f6f6b]"
                          : "bg-white text-slate-700 hover:bg-gray-50"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <Link href={`/projects/${project.id}/create`} className="flex items-center gap-1.5 bg-[#0f6f6b] text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-[#0c5d5a] transition">
                  <Plus size={15} />
                  Ask a question
                </Link>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-3">
              {project.posts.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-3xl mb-2">💬</p>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">No questions yet</h3>
                  <p className="text-sm text-slate-500">Be the first to ask something about {project.name}.</p>
                </div>
              ) : (
                project.posts.map((post) => (
                  <div
                    key={post.id}
                    className={`bg-white border border-gray-200 hover:border-gray-300 transition ${
                      viewMode === "card" ? "rounded-lg" : "rounded-md"
                    }`}
                  >
                    <div className={viewMode === "card" ? "p-4" : "px-3 py-2"}>
                      <div className="flex gap-3">

                        {/* Vote */}
                        <PostVoteButtons postId={post.id} initialUpvotes={post.upvotes} />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            {post.isPinned && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                Pinned
                              </span>
                            )}
                            {post.isHot && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                🔥 Hot
                              </span>
                            )}
                            <span className="text-xs text-gray-500">{post.category}</span>
                          </div>

                          <Link href={`/posts/${post.id}`} className="block group">
                            <h3 className={`font-semibold text-black group-hover:text-[#0f6f6b] transition-colors ${
                              viewMode === "card" ? "text-base mb-1" : "text-sm mb-0"
                            }`}>
                              {post.title}
                            </h3>

                            {viewMode === "card" && (
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{post.preview}</p>
                            )}
                          </Link>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                            <span>{post.avatar} {post.author}</span>
                            <span>{post.timestamp}</span>
                            <span> {post.replies} replies</span>
                            <span> {post.views} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
