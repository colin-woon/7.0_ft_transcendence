import { getProjectPostsBySort } from '@/features/forum/api/project';
import { getAllPosts, searchPosts } from '@/features/forum/api/post'
import { sortPosts, type ForumPost, type ForumSort } from '@/features/forum/models';
import ForumPostsClient from '@/features/forum/ui/wesley_posts/screen/ForumPostsClient';

interface ForumRouteProps {
  searchParams?: Promise<{
    projectId?: string | string[];
    sort?: string | string[];
    q?: string | string[];
  }>;
}

export default async function ForumRoute({ searchParams }: ForumRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const projectIdRaw = params?.projectId;
  const projectIdParam = Array.isArray(projectIdRaw) ? projectIdRaw[0] : projectIdRaw;
  const parsedProjectId = projectIdParam ? Number(projectIdParam) : Number.NaN;
  const hasValidProjectId = Number.isFinite(parsedProjectId) && parsedProjectId > 0;

  const sortRaw = params?.sort;
  const sortParam = Array.isArray(sortRaw) ? sortRaw[0] : sortRaw;
  const activeSort: ForumSort = sortParam === 'New' ? 'New' : 'Top';

  const qRaw = params?.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const searchQuery = (q ?? '').trim();

  let posts: ForumPost[] = [];
  let fetchError: string | null = null;

  
  try {
    if (searchQuery.length >= 2 && !hasValidProjectId) {
      posts = sortPosts(await searchPosts(searchQuery), activeSort);
    } else {
      posts = hasValidProjectId
        ? await getProjectPostsBySort(parsedProjectId, activeSort)
        : await getAllPosts(activeSort);
    }
  } catch (error: unknown) {
    fetchError = error instanceof Error ? error.message : 'Failed to fetch posts.';
  }

  return <ForumPostsClient initialPosts={posts} fetchError={fetchError} activeSort={activeSort} initialSearch={searchQuery} />;
}
