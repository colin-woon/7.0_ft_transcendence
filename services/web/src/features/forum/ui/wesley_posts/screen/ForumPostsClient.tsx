'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppShell } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext';
import {
  filterPosts,
  forumCategories,
  forumSortOptions,
  type ForumPost,
  type ForumSort,
  type ForumViewMode,
} from '@/features/forum/models';
import EmptyPostsState from '../components/EmptyPostsState';
import PostListControls from '../components/PostListControls';
import PostRow from '../components/PostRow';

interface ForumPostsClientProps {
  initialPosts: ForumPost[];
  fetchError: string | null;
  activeSort: ForumSort;
}

export default function ForumPostsClient({ initialPosts, fetchError, activeSort }: ForumPostsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { searchQuery } = useAppShell();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ForumViewMode>('card');
 
  const handleSortChange = (sort: ForumSort) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('sort', sort);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  const filteredPosts = useMemo(() => {
    return filterPosts(initialPosts, searchQuery, activeCategory);
  }, [initialPosts, searchQuery, activeCategory]);

  return (
    <div className="max-w-5xl mx-auto">
      <PostListControls
        activeSort={activeSort}
        onSortChange={handleSortChange}
        sortOptions={forumSortOptions}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={forumCategories}
      />

      <div className="space-y-3 mt-3">
        {fetchError ? (
          <div className="bg-white border border-red-200 rounded-lg p-8 text-center text-red-600">
            {fetchError}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyPostsState />
        ) : (
          filteredPosts.map((post) => <PostRow key={post.id} post={post} viewMode={viewMode} />)
        )}
      </div>
    </div>
  );
}
