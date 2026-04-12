'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAppShell } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext';
import {
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
  initialSearch?: string;
}

export default function ForumPostsClient({
  initialPosts,
  fetchError,
  activeSort,
  initialSearch = '',
}: ForumPostsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { searchQuery, setSearchQuery } = useAppShell();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<ForumViewMode>('card');
  const [, startTransition] = useTransition();
  const lastSubmittedQueryRef = useRef(initialSearch.trim());
  const urlQuery = searchParams.get('q')?.trim() ?? '';

  useEffect(() => {
    // Keep the shared header search text aligned with URL q when navigating.
    if (urlQuery !== lastSubmittedQueryRef.current) {
      setSearchQuery(urlQuery);
      lastSubmittedQueryRef.current = urlQuery;
    }
  }, [urlQuery, setSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedSearch = searchQuery.trim();

      if (trimmedSearch === urlQuery) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      if (trimmedSearch.length >= 2) {
        nextParams.set('q', trimmedSearch);
      } else {
        nextParams.delete('q');
      }

      const nextParamsString = nextParams.toString();
      const nextUrl = nextParamsString
        ? `${pathname}?${nextParamsString}`
        : pathname;

      // Transition keeps typing responsive while route/server data updates.
      lastSubmittedQueryRef.current = trimmedSearch;
      startTransition(() => {
        router.replace(nextUrl);
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery, searchParams, pathname, router, startTransition, urlQuery]);

  const handleSortChange = (sort: ForumSort) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('sort', sort);
    router.replace(`${pathname}?${nextParams.toString()}`);
  };

  const filteredPosts = useMemo(() => {
    return initialPosts.filter(
      (post) => activeCategory === 'All' || post.category === activeCategory
    );
  }, [initialPosts, activeCategory]);

  return (
    <div className="max-w-5xl mx-auto">
      <PostListControls
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
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
          filteredPosts.map((post) => <PostRow key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
