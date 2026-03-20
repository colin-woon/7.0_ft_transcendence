import { getAllPosts, getProjectPosts } from '@/features/forum/api';
import type { ForumPost } from '@/features/forum/model';
import ForumPostsClient from '@/features/forum/ui/home/screen/ForumPostsClient';

interface ForumRouteProps {
  searchParams?: Promise<{
    projectId?: string | string[];
  }>;
}

export default async function ForumRoute({ searchParams }: ForumRouteProps) {
  const params = searchParams ? await searchParams : undefined;
  const projectIdRaw = params?.projectId;
  const projectIdParam = Array.isArray(projectIdRaw) ? projectIdRaw[0] : projectIdRaw;
  const parsedProjectId = projectIdParam ? Number(projectIdParam) : Number.NaN;
  const hasValidProjectId = Number.isFinite(parsedProjectId) && parsedProjectId > 0;

  let posts: ForumPost[] = [];
  let fetchError: string | null = null;

  try {
    posts = hasValidProjectId ? await getProjectPosts(parsedProjectId) : await getAllPosts();
  } catch (error: unknown) {
    fetchError = error instanceof Error ? error.message : 'Failed to fetch posts.';
  }

  return <ForumPostsClient initialPosts={posts} fetchError={fetchError} />;
}
