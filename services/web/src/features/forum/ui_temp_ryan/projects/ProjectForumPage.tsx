'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Zap, MessageCircle, Users, Search } from 'lucide-react';
import type { Project } from '../../models/projects';
import PostVoteButtons from '../../ui/projects/posts/components/PostVoteButtons';
import ProjectInfoCard from './ProjectInforCard';
import { deleteForumPost } from '@/features/forum/api/moderation';
import { PostModerationControls } from '@/features/forum/ui/projects/moderation';
import TextType from '@/components/react-bits/TextType';
import SubscriptionButton from '@/features/forum/ui/projects/SubscriptionButton';
import CreatePostButton from './CreatePostButton';
import { AnimatedPostsGrid } from './AnimatedPostsGrid';
import { PaginationControls } from './PaginationControls';
import ForumTrailButtons from '@/features/forum/ui/shared/ForumTrailButtons';

const sortOptions = ['New', 'Top'];

export default function ProjectForumPage({ project }: { project: Project }) {
  const PAGE_SIZE = 8;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get('sort') === 'New' ? 'New' : 'Top';
  const [postSearch, setPostSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [projectPosts, setProjectPosts] = useState(project.posts);
  const [isBusy, setIsBusy] = useState(false);
  const displayTags = project.tags?.length
    ? project.tags.slice(0, 4)
    : ['No Tag'];

  const handleSortChange = (sort: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('sort', sort);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  useEffect(() => {
    setProjectPosts(project.posts);
  }, [project.posts]);

  const filteredPosts = useMemo(() => {
    const normalizedSearch = postSearch.trim().toLowerCase();

    if (normalizedSearch.length === 0) {
      return projectPosts;
    }

    return projectPosts.filter((post) => {
      const titleMatch = post.title.toLowerCase().includes(normalizedSearch);
      const previewMatch = post.preview
        .toLowerCase()
        .includes(normalizedSearch);
      const authorMatch = post.author.toLowerCase().includes(normalizedSearch);
      return titleMatch || previewMatch || authorMatch;
    });
  }, [projectPosts, postSearch]);

  const rowPosts = useMemo(
    () =>
      filteredPosts.map((post) => ({
        id: post.id,
        title: post.title,
        author: post.author,
        authorId: post.authorId,
        avatar: post.avatar,
        comments: post.replies,
        views: post.views,
        upvotes: post.upvotes,
        userVote: post.userVote,
        category: post.category,
        timestamp: post.timestamp,
        isPinned: post.isPinned,
      })),
    [filteredPosts]
  );

  const totalPages = Math.max(1, Math.ceil(rowPosts.length / PAGE_SIZE));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return rowPosts.slice(start, start + PAGE_SIZE);
  }, [rowPosts, currentPage]);

  const pageKey = [
    String(project.id),
    activeSort,
    postSearch.trim().toLowerCase(),
    String(currentPage),
  ].join('|');

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSort, postSearch, projectPosts]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDeletePost = async (postId: number) => {
    setIsBusy(true);
    try {
      await deleteForumPost(postId);
      setProjectPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Failed to delete post'
      );
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col font-sans">
      <div className="sticky top-16 z-50 ">
        {/* Header */}
        <div className="card card-border shadow-xl w-full max-w-full rounded-none sm:rounded-box backdrop-blur-sm">
          <div className="card-body px-4 sm:px-6 py-4 sm:py-5 min-h-0 sm:min-h-[13rem] overflow-hidden">
            <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_11rem] lg:gap-6">
              <div className="min-w-0">
                <TextType
                  className="text-2xl sm:text-5xl leading-tight text-slate-800 font-interface tracking-wide uppercase break-words line-clamp-2 sm:line-clamp-none"
                  text={project.name}
                  typingSpeed={75}
                  pauseDuration={300}
                  showCursor
                  cursorCharacter="_"
                  deletingSpeed={50}
                  variableSpeed={{ min: 60, max: 120 }}
                  cursorBlinkDuration={0.5}
                  loop={false}
                  initialDelay={500}
                  onSentenceComplete={() => {}}
                />

                <div className="mt-2 sm:mt-3">
                  <TextType
                    className="text-xs sm:text-base leading-snug font-interface break-words line-clamp-2 sm:line-clamp-none"
                    text={project.description}
                    typingSpeed={300}
                    pauseDuration={1500}
                    showCursor
                    cursorCharacter="_"
                    deletingSpeed={50}
                    variableSpeed={{ min: 30, max: 50 }}
                    cursorBlinkDuration={0.5}
                    initialDelay={500}
                    loop={false}
                    onSentenceComplete={() => {}}
                  />
                </div>

                {/* Search bar and tabs row: flex on sm+, stacked on mobile */}
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center min-w-0">
                  <div className="relative flex-1 max-w-md min-w-0">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8EE7E3] bg-gray-50 hover:border-[#8EE7E3] hover:shadow"
                    />
                  </div>

                  <div className="hidden sm:block">
                    <div role="tablist" className="tabs tabs-box">
                      {sortOptions.map((f) => (
                        <button
                          key={f}
                          type="button"
                          role="tab"
                          className={`tab ${activeSort === f ? 'tab-active' : ''}`}
                          onClick={() => handleSortChange(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-50 shrink-0 justify-self-center lg:justify-self-center">
                <div className="grid grid-cols-3 gap-2 lg:grid-cols-3 lg:gap-2 justify-self-center lg:justify-self-end">
                  <div className="text-center py-1">
                    <Zap className="mx-auto mb-1 h-3 w-3 text-slate-500" />
                    <p className="text-xs font-semibold text-gray-900">
                      {project.xp ?? 0} xp
                    </p>
                  </div>
                  <div className="text-center py-1">
                    <MessageCircle className="mx-auto mb-1 h-3 w-3 text-slate-500" />
                    <p className="text-xs font-semibold text-gray-900">
                      {project.posts?.length ?? 0} posts
                    </p>
                  </div>
                  <div className="text-center py-1">
                    <Users className="mx-auto mb-1 h-3 w-3 text-slate-500" />
                    <p className="text-xs font-semibold text-gray-900">
                      {project.students ?? 0} students
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5 justify-self-center lg:justify-self-end">
                  {displayTags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex mt-5 items-center justify-self-center lg:justify-self-end gap-1.5">
                  <SubscriptionButton
                    projectId={project.id}
                    compact
                    className="h-10 w-10"
                  />
                  <CreatePostButton projectId={project.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 pt-15 flex items-center justify-between gap-3">
        <ForumTrailButtons
          className="mb-0"
          items={[
            { label: 'Projects', href: '/projects' },
            { label: project.slug },
          ]}
        />
        <p className="text-xs text-slate-400 mb-0 text-right font-interface">
          Results: {filteredPosts.length} post
          {filteredPosts.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="sm:p-6 w-full">
        <div className="w-full max-w-6xl mx-auto px-4 py-0">
          <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-start lg:gap-8">
            <div className="w-full min-w-0 space-y-3 lg:flex-[1.8]">
              {/* ── Forum section ── */}
              <div className="w-[min(100%,76rem)] mx-auto">
                {rowPosts.length === 0 ? (
                  <div className="w-full bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <h3 className="text-base font-semibold text-slate-800 mb-1">
                      {postSearch.trim().length > 0
                        ? 'No matching questions'
                        : 'No questions yet'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {postSearch.trim().length > 0
                        ? `Try another keyword for ${project.name}.`
                        : `Be the first to ask something about ${project.name}.`}
                    </p>
                  </div>
                ) : (
                  <>
                    <AnimatedPostsGrid
                      pageKey={pageKey}
                      posts={paginatedPosts}
                      project={project}
                      isBusy={isBusy}
                      onDeletePost={handleDeletePost}
                    />
                    <div className="pt-3">
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
