'use client';

import Link from 'next/link';
import { ArrowLeft, MessageCircle, Eye, ThumbsUp } from 'lucide-react';
import type { ForumPostDetail, ForumComment } from '@/features/forum/model';
import PostVoteButtons from '../components/PostVoteButtons';
import CommentVoteButtons from '../components/CommentVoteButtons';

interface PostDetailClientProps {
  post: ForumPostDetail;
  comments: ForumComment[];
}

export default function PostDetailClient({ post, comments }: PostDetailClientProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/posts"
        className="flex items-center gap-2 text-[#0f6f6b] hover:text-[#0c5d5a] font-medium mb-6 transition"
      >
        <ArrowLeft size={18} />
        Back to forum
      </Link>

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
              <span className="text-xs text-gray-500 font-medium">{post.category}</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-3">{post.title}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span className="font-medium">{post.author}</span>
              <span>{post.timestamp}</span>
            </div>

            <div className="flex gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{post.views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={16} />
                <span>{post.comments} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp size={16} />
                <span>{post.upvotes} upvotes</span>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-slate-900">
              {post.content}
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
        <h2 className="text-xl font-bold text-slate-900 mb-4">{comments.length} Comments</h2>

        {comments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
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
    </div>
  );
}
