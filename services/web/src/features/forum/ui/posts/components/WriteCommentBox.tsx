'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import type { ForumComment } from '@/features/forum/models';
import { createPostComment, getPostComments } from '@/features/forum/api/post';

interface WriteCommentBoxProps {
  postId: number;
  onCommentCreated?: (comment: ForumComment) => void;
}

export default function WriteCommentBox({
  postId,
  onCommentCreated,
}: WriteCommentBoxProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = !isSubmitting && content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await createPostComment(postId, { content: content.trim() });

      if (onCommentCreated) {
        try {
          const latestComments = await getPostComments(postId);
          const newestComment = latestComments[0];

          if (newestComment) {
            onCommentCreated(newestComment);
          }
        } catch (fetchError) {
          console.error(
            'Failed to fetch latest comment after create:',
            fetchError
          );
        }
      }

      setContent('');
      router.refresh();
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert(
        error instanceof Error ? error.message : 'Could not create comment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-900">
          Write a comment
        </h3>
      </div>

      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add your thoughts..."
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/70 focus:border-transparent focus:bg-white transition resize-y"
      />

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
            canSubmit
              ? 'bg-[#0f6f6b] text-white hover:bg-[#0c5d5a]'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={13} />
          )}
          {isSubmitting ? 'Posting...' : 'Post comment'}
        </button>
      </div>
    </form>
  );
}
