'use client';

import { useMemo, useState } from 'react';
import { useAppShell } from '@/features/app-shell/context/AppShellContext';
import {
  filterPosts,
  forumCategories,
  forumSortOptions,
  sortPosts,
  type ForumPost,
  type ForumSort,
  type ForumViewMode,
} from '@/features/forum/model';
import EmptyPostsState from '../components/EmptyPostsState';
import PostListControls from '../components/PostListControls';
import PostRow from '../components/PostRow';

interface ForumPostsClientProps {
  initialPosts: ForumPost[];
  fetchError: string | null;
}

export default function ForumPostsClient({ initialPosts, fetchError }: ForumPostsClientProps) {
  const { searchQuery } = useAppShell();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ForumViewMode>('card');
  const [activeSort, setActiveSort] = useState<ForumSort>('Top');

  const sortedPosts = useMemo(() => {
    const filtered = filterPosts(initialPosts, searchQuery, activeCategory);
    return sortPosts(filtered, activeSort);
  }, [initialPosts, searchQuery, activeCategory, activeSort]);

  return (
    <div className="max-w-5xl mx-auto">
      <PostListControls
        activeSort={activeSort}
        setActiveSort={setActiveSort}
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
        ) : sortedPosts.length === 0 ? (
          <EmptyPostsState />
        ) : (
          sortedPosts.map((post) => <PostRow key={post.id} post={post} viewMode={viewMode} />)
        )}
      </div>
    </div>
  );
}
