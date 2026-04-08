'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Eye, ThumbsUp } from 'lucide-react';
import type { ForumPostDetail, ForumComment } from '@/features/forum/models';
import PostVoteButtons from '../components/PostVoteButtons';
import CommentVoteButtons from '../components/CommentVoteButtons';
import WriteCommentBox from '../components/WriteCommentBox';
import { deleteForumComment, deleteForumPost, updateForumComment, updateForumPost } from '@/features/forum/api/moderation';
import {
  CommentModerationControls,
  EditCommentDialog,
  EditPostDialog,
  PostModerationControls,
} from '@/features/forum/ui/projects/moderation';

interface PostDetailClientProps {
  post: ForumPostDetail;
  comments: ForumComment[];
}

export default function PostDetailClient({ post, comments }: PostDetailClientProps) {
  const router = useRouter();
  const [postState, setPostState] = useState(post);
  const [commentState, setCommentState] = useState(comments);
  const [isBusy, setIsBusy] = useState(false);
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const editingComment =
    typeof editingCommentId === 'number'
      ? commentState.find((comment) => comment.id === editingCommentId) ?? null
      : null;

  useEffect(() => {
    setPostState(post);
  }, [post]);

  useEffect(() => {
    setCommentState(comments);
  }, [comments]);

  const handleEditPost = async (payload: { title: string; content: string }) => {
    setIsBusy(true);
    setEditError(null);
    try {
      await updateForumPost(postState.id, payload);
      setPostState((prev) => ({ ...prev, title: payload.title, content: payload.content }));
      setIsEditPostOpen(false);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update post');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeletePost = async () => {
    await deleteForumPost(postState.id);
    router.push('/posts');
    router.refresh();
  };

  const handleEditComment = async (payload: { content: string }) => {
    if (typeof editingCommentId !== 'number') {
      return;
    }

    setIsBusy(true);
    setEditError(null);
    try {
      await updateForumComment(postState.id, editingCommentId, payload);
      setCommentState((prev) =>
        prev.map((comment) => (comment.id === editingCommentId ? { ...comment, content: payload.content } : comment)),
      );
      setEditingCommentId(null);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'Failed to update comment');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    await deleteForumComment(postState.id, commentId);
    setCommentState((prev) => prev.filter((comment) => comment.id !== commentId));
    setPostState((prev) => ({ ...prev, comments: Math.max(0, prev.comments - 1) }));
  };

  const handleCommentCreated = (newComment: ForumComment) => {
    setCommentState((prev) => {
      if (prev.some((comment) => comment.id === newComment.id)) {
        return prev;
      }

      return [newComment, ...prev];
    });
    setPostState((prev) => ({ ...prev, comments: prev.comments + 1 }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#0f6f6b] hover:text-[#0c5d5a] font-medium mb-6 transition"
      >
        <ArrowLeft size={18} />
        Back to forum
      </button>
    
      {/* Post header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex gap-4">
          <PostVoteButtons postId={post.id} initialUpvotes={post.upvotes} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {post.isPinned && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Pinned
                </span>
              )}
              <span className="text-xs text-gray-500 font-medium">{postState.category}</span>
              <div className="ml-auto">
                <PostModerationControls
                  authorId={postState.authorId}
                  isBusy={isBusy}
                  onEdit={() => {
                    setEditError(null);
                    setIsEditPostOpen(true);
                  }}
                  onDelete={handleDeletePost}
                />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-3">{postState.title}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="font-medium">{postState.author}</span>
              <span>{postState.timestamp}</span>
            </div>

            <div className="flex gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{postState.views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                <span>{postState.comments} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp size={16} />
                <span>{postState.upvotes} upvotes</span>
              </div>
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words text-slate-900">
              {postState.content}
            </div>
          </div>
        </div>
      </div>

      {/* Post content
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="prose prose-sm max-w-none text-slate-900">
          {post.content}
        </div>
      </div> */}

      {/* Comments section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">{commentState.length} Comments</h2>

        {commentState.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {commentState.map((comment) => (
              <div
                key={comment.id}
                className={`bg-white border rounded-lg p-4 ${
                  comment.isBestAnswer ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200'
                }`}
              >
                <div className="flex gap-3">
                  <CommentVoteButtons postId={post.id} commentId={comment.id} initialUpvotes={comment.upvotes} />
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {comment.author[0]?.toUpperCase() ?? 'U'}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-slate-900">
                        {comment.author}
                      </span>
                      <CommentModerationControls
                        authorId={comment.authorId}
                        isBusy={isBusy}
                        onEdit={() => {
                          setEditError(null);
                          setEditingCommentId(comment.id);
                        }}
                        onDelete={() => handleDeleteComment(comment.id)}
                      />
                      {comment.isBestAnswer && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          Best answer
                        </span>
                      )}
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>

                    <p className="text-sm text-slate-700 mb-2">{comment.content}</p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <button className="flex items-center gap-1 hover:text-[#0f6f6b] transition">
                        <ThumbsUp size={14} />
                        <span>{comment.upvotes}</span>
                      </button>
                      <button className="hover:text-[#0f6f6b] transition">Reply</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-2">
        <WriteCommentBox postId={postState.id} onCommentCreated={handleCommentCreated} />
      </div>

      <EditPostDialog
        isOpen={isEditPostOpen}
        initialTitle={postState.title}
        initialContent={postState.content}
        isSubmitting={isBusy}
        error={editError}
        onCancel={() => {
          setIsEditPostOpen(false);
          setEditError(null);
        }}
        onSubmit={handleEditPost}
      />

      <EditCommentDialog
        isOpen={Boolean(editingComment)}
        initialContent={editingComment?.content ?? ''}
        isSubmitting={isBusy}
        error={editError}
        onCancel={() => {
          setEditingCommentId(null);
          setEditError(null);
        }}
        onSubmit={handleEditComment}
      />
    </div>
  );
}
