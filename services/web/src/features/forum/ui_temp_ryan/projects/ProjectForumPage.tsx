"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Project } from "../../models/projects";
import PostVoteButtons from '../../ui/projects/posts/components/PostVoteButtons';
import ProjectInfoCard from "./ProjectInforCard";
import { deleteForumPost } from '@/features/forum/api/moderation';
import { PostModerationControls } from '@/features/forum/ui/projects/moderation';


const sortOptions = ["New", "Top"];

export default function ProjectForumPage({ project }: { project: Project }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get('sort') === 'New' ? 'New' : 'Top';
  const [viewMode, setViewMode] = useState<"card" | "compact">("card");
  const [postSearch, setPostSearch] = useState("");
  const [projectPosts, setProjectPosts] = useState(project.posts);
  const [isBusy, setIsBusy] = useState(false);

  const handleSortChange = (sort: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('sort', sort);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  const filteredPosts = useMemo(() => {
    const normalizedSearch = postSearch.trim().toLowerCase();

    if (normalizedSearch.length === 0) {
      return projectPosts;
    }

    return projectPosts.filter((post) => {
      const titleMatch = post.title.toLowerCase().includes(normalizedSearch);
      const previewMatch = post.preview.toLowerCase().includes(normalizedSearch);
      const authorMatch = post.author.toLowerCase().includes(normalizedSearch);
      return titleMatch || previewMatch || authorMatch;
    });
  }, [projectPosts, postSearch]);

  const handleDeletePost = async (postId: number) => {
    setIsBusy(true);
    try {
      await deleteForumPost(postId);
      setProjectPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete post');
    } finally {
      setIsBusy(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#f9f9f9] pt-[var(--navbar-height)] overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-4 lg:hidden">
            <ProjectInfoCard project={project} className="w-full" />
          </div>

          <div className="flex flex-col items-start gap-5 lg:flex-row lg:gap-8">
            <div className="w-full min-w-0 space-y-3 lg:flex-[1.8]">
              {/* ── Forum section ── */}
              <div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">Sort by:</span>
                                
                {/* Daisy UI Horizontal Menu */}
                <ul className="menu menu-horizontal bg-gray-50 border border-gray-200 rounded-box p-1 gap-1">
                  {sortOptions.map((option) => (
                    <li key={option}>
                      <a
                        onClick={() => handleSortChange(option)}
                        className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                          activeSort === option
                            ? "bg-[#8EE7E3]/30 text-[#0f6f6b] active:!bg-[#8EE7E3]/40" 
                            : "text-slate-600 hover:bg-gray-200"
                        }`}
                      >
                        {option}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                placeholder={`Search posts in ${project.name}...`}
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
              />
            </div>

            {/* Posts */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {filteredPosts.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-3xl mb-2"></p>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">
                    {postSearch.trim().length > 0 ? 'No matching questions' : 'No questions yet'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {postSearch.trim().length > 0
                      ? `Try another keyword for ${project.name}.`
                      : `Be the first to ask something about ${project.name}.`}
                  </p>
                </div>
              ) : (
              filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
                    >
                      <div className="flex gap-0">
                        
                        {/* Vote column */}
                        <div className="flex flex-col items-center justify-start pt-4 px-3 w-12 shrink-0">
                          <PostVoteButtons postId={post.id} initialUpvotes={post.upvotes} />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 py-3 pr-4 min-w-0">
                          
                          {/* Top line: tags + timestamp */}
                          <div className="flex items-center gap-2 mb-1">
                            {post.isPinned && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                Pinned
                              </span>
                            )}
                            {post.isHot && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                Hot
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">{post.category}</span>
                            <span className="ml-auto text-[10px] text-gray-400">{post.timestamp}</span>
                          </div>

                          {/* Title */}
                          <Link href={`${project.id}/posts/${post.id}`} className="group block">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0f6f6b] transition-colors leading-snug mb-1">
                              {post.title}
                            </h3>
                            {viewMode === "card" && (
                              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{post.preview}</p>
                            )}
                          </Link>

                          {/* Comments button (uses ProjectInfoCard widget style) */}
                          <button
                            type="button"
                            className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 bg-white text-[11px] font-medium text-slate-600 hover:bg-[#e6f7f6] hover:border-[#8EE7E3] transition group"
                          >
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" className="text-[#0f6f6b]">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{post.replies} Comments</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
            </div>
          </div>
            </div>

            <div className="hidden lg:ml-auto lg:block lg:w-64 lg:shrink-0">
              <ProjectInfoCard project={project} className="w-full" />
            </div>
          </div>
        </div>
      </div>
  );
}
