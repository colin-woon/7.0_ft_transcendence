import { getPostDetail, getPostComments } from '@/features/forum/api/post';
import PostDetailClient from '@/features/forum/ui/projects/posts/screen/PostDetailClient';
import { notFound } from 'next/navigation';

interface PostDetailPageProps {
  params: Promise<{
    postId: string;
  }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  const postIdNum = Number(postId);

  if (!Number.isFinite(postIdNum) || postIdNum <= 0) {
    notFound();
  }

  try {
    const [{ post }, comments] = await Promise.all([
      getPostDetail(postIdNum),
      getPostComments(postIdNum),
    ]);

    return <PostDetailClient post={post} comments={comments} />;
  } catch (error) {
    console.error('Failed to load post detail:', error);
    notFound();
  }
}