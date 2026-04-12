import { getPostDetail, getPostComments } from '@/features/forum/api/post';
import { getProjectDetails } from '@/features/forum/api/project';
import PostDetailClient from '@/features/forum/ui/projects/posts/screen/PostDetailClient';
import { notFound } from 'next/navigation';

interface PostDetailPageProps {
  params: Promise<{
    id: string;
    postId: string;
  }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id, postId } = await params;
  const projectIdNum = Number(id);
  const postIdNum = Number(postId);

  if (!Number.isFinite(projectIdNum) || projectIdNum <= 0 || !Number.isFinite(postIdNum) || postIdNum <= 0) {
    notFound();
  }

  try {
    const [{ post, projectName }, comments, project] = await Promise.all([
      getPostDetail(postIdNum),
      getPostComments(postIdNum),
      getProjectDetails(projectIdNum),
    ]);

    return (
      <PostDetailClient
        post={post}
        comments={comments}
        projectId={projectIdNum}
        projectName={project?.name ?? projectName ?? post.category}
        projectSlug={project?.slug ?? (projectName ?? post.category).toLowerCase().replace(/\s+/g, '-')}
        projectDescription={project?.description ?? ''}
      />
    );
  } catch (error) {
    console.error('Failed to load post detail:', error);
    notFound();
  }
}