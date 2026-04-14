"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Eye, AlertCircle } from "lucide-react";
import type { ForumPostDetail, ForumComment } from "@/features/forum/models";
import PostVoteButtons from "../components/PostVoteButtons";
import CommentVoteButtons from "../components/CommentVoteButtons";
import WriteCommentBox from "../components/WriteCommentBox";
import { PaginationControls } from "@/features/forum/ui/shared/PaginationControls";
import ForumTrailButtons from "@/features/forum/ui/shared/ForumTrailButtons";
import {
  deleteForumComment,
  deleteForumPost,
  updateForumComment,
  updateForumPost,
} from "@/features/forum/api/moderation";
import {
  CommentModerationControls,
  EditCommentDialog,
  EditPostDialog,
  PostModerationControls,
} from "@/features/forum/ui/moderation";

interface PostDetailClientProps {
  post: ForumPostDetail;
  comments: ForumComment[];
  projectId: number;
  projectName: string;
  projectSlug: string;
  projectDescription: string;
}

function BlinkingText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`inline-block whitespace-pre-wrap tracking-tight ${className ?? ""}`}
    >
      <span className="inline">{text}</span>
      <span
        className={`ml-1 inline-block ${showCursor ? "opacity-100" : "opacity-0"}`}
      >
        _
      </span>
    </div>
  );
}

export default function PostDetailClient({
  post,
  comments,
  projectId,
  projectName,
  projectSlug,
  projectDescription,
}: PostDetailClientProps) {
  const router = useRouter();
  const [postState, setPostState] = useState(post);
  const [commentState, setCommentState] = useState(comments);
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(false);
  const [isEditPostOpen, setIsEditPostOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const COMMENTS_PER_PAGE = 6;

  const totalCommentPages = Math.max(
    1,
    Math.ceil(commentState.length / COMMENTS_PER_PAGE),
  );
  const paginatedComments = commentState.slice(
    (currentCommentPage - 1) * COMMENTS_PER_PAGE,
    currentCommentPage * COMMENTS_PER_PAGE,
  );

  const editingComment =
    typeof editingCommentId === "number"
      ? (commentState.find((comment) => comment.id === editingCommentId) ??
        null)
      : null;

  useEffect(() => {
    setPostState(post);
  }, [post]);

  useEffect(() => {
    setCommentState(comments);
    setCurrentCommentPage(1);
  }, [comments]);

  useEffect(() => {
    if (currentCommentPage > totalCommentPages) {
      setCurrentCommentPage(totalCommentPages);
    }
  }, [currentCommentPage, totalCommentPages]);

  const handleEditPost = async (payload: {
    title: string;
    content: string;
  }) => {
    setIsBusy(true);
    setEditError(null);
    try {
      await updateForumPost(postState.id, payload);
      setPostState((prev) => ({
        ...prev,
        title: payload.title,
        content: payload.content,
      }));
      setIsEditPostOpen(false);
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Failed to update post",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeletePost = async () => {
    await deleteForumPost(postState.id);
    router.push(`/projects/${projectId}`);
    router.refresh();
  };

  const handleEditComment = async (payload: { content: string }) => {
    if (typeof editingCommentId !== "number") {
      return;
    }

    setIsBusy(true);
    setEditError(null);
    try {
      await updateForumComment(postState.id, editingCommentId, payload);
      setCommentState((prev) =>
        prev.map((comment) =>
          comment.id === editingCommentId
            ? { ...comment, content: payload.content }
            : comment,
        ),
      );
      setEditingCommentId(null);
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Failed to update comment",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    await deleteForumComment(postState.id, commentId);
    setCommentState((prev) =>
      prev.filter((comment) => comment.id !== commentId),
    );
    setPostState((prev) => ({
      ...prev,
      comments: Math.max(0, prev.comments - 1),
    }));
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
    <div className="flex min-h-full flex-col font-sans">
      <div className="sticky top-11 z-50">
        <div className="card card-border shadow-xl w-full max-w-full rounded-none sm:rounded-box backdrop-blur-sm">
          <div className="card-body px-4 sm:px-6 py-4 sm:py-5 min-h-0 sm:min-h-[10rem] overflow-hidden">
            <div className="grid h-full grid-cols-1 gap-4">
              <div className="min-w-0">
                <BlinkingText
                  className="text-2xl sm:text-5xl leading-tight text-slate-800 font-interface tracking-wide uppercase break-words line-clamp-2 sm:line-clamp-none"
                  text={projectName}
                />

                <div className="mt-2 sm:mt-3">
                  <BlinkingText
                    className="text-xs sm:text-base leading-snug font-interface break-words line-clamp-2 sm:line-clamp-none"
                    text={
                      projectDescription ||
                      "Share a question, project, or idea with the 42 community."
                    }
                  />
                </div>
                <div className="mt-1 flex items-start gap-2">
                  <AlertCircle
                    size={14}
                    className="text-amber-500 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-s text-amber-700 leading-relaxed">
                    Be Civil: Always be respectful, even when disagreeing.
                    Attack the code, not the person.
                  </p>
                </div>
                <div className="mt-1 flex items-start gap-2">
                  <AlertCircle
                    size={14}
                    className="text-amber-500 mt-0.5 flex-shrink-0"
                  />
                  <p className="text-s text-amber-700 leading-relaxed">
                    Stay On Topic: Ensure your posts and comments relate
                    directly to the thread's subject matter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 pt-10">
        <ForumTrailButtons
          className="mb-0"
          items={[
            { label: "Projects", href: "/projects" },
            { label: projectSlug, href: `/projects/${projectId}` },
            { label: "Post" },
          ]}
        />
      </div>

      <div className="w-full max-w-5xl mx-auto mt-0 px-4">
        {/* Post header */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-3 mb-3">
          <div className="flex gap-6 items-center">
            <PostVoteButtons
              postId={post.id}
              initialUpvotes={post.upvotes}
              initialUserVote={post.userVote}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-small text-sm">{postState.author}</span>
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

              <h1 className="text-xl font-semibold text-slate-900 mb-1">
                {postState.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span>{postState.timestamp}</span>
                <div className="flex items-center gap-1">
                  <Eye size={16} />
                  <span>{postState.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={16} />
                  <span>{postState.comments} comments</span>
                </div>
              </div>

              <div className="flex gap-6 text-sm text-gray-500"></div>
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
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {commentState.length} Comments
          </h2>

          {commentState.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`bg-white border rounded-lg p-6 ${
                    comment.isBestAnswer
                      ? "border-emerald-300 bg-emerald-50/40"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex gap-3">
                    <CommentVoteButtons
                      postId={post.id}
                      commentId={comment.id}
                      initialUpvotes={comment.upvotes}
                      initialUserVote={comment.userVote}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-900">
                          {comment.author}
                        </span>
                        {comment.isBestAnswer && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Best answer
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {comment.timestamp}
                        </span>
                        <div className="ml-auto">
                          <CommentModerationControls
                            authorId={comment.authorId}
                            isBusy={isBusy}
                            onEdit={() => {
                              setEditError(null);
                              setEditingCommentId(comment.id);
                            }}
                            onDelete={() => handleDeleteComment(comment.id)}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 mb-2">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {totalCommentPages > 1 && (
                <div className="pt-2">
                  <PaginationControls
                    currentPage={currentCommentPage}
                    totalPages={totalCommentPages}
                    onPageChange={setCurrentCommentPage}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-2">
          <WriteCommentBox
            postId={postState.id}
            onCommentCreated={handleCommentCreated}
          />
        </div>
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
        initialContent={editingComment?.content ?? ""}
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
