import Link from "next/link";
import type { ForumPost } from "../../../models";
import PostVoteButtons from "./PostVoteButtons";
import type { Project } from "../../../models/projects";
import { MessageCircle, Eye } from "lucide-react";
import { PostModerationControls } from "../../moderation";

interface PostRowProps {
  post: ForumPost;
  project?: Project;
  isBusy?: boolean;
  onEditPost?: (postId: number) => void;
  onDeletePost?: (postId: number) => Promise<void>;
}

export default function PostRow({
  project,
  post,
  isBusy = false,
  onEditPost,
  onDeletePost,
}: PostRowProps) {
  const href = project
    ? `/projects/${project.id}/posts/${post.id}`
    : `/posts/${post.id}`;

  const handleEdit = onEditPost ? () => onEditPost(post.id) : undefined;
  const handleDelete = onDeletePost ? () => onDeletePost(post.id) : undefined;

  return (
    <div className="w-full min-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transform-gpu transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.015] hover:border-slate-400 hover:shadow-2xl">
      <div className="w-full h-[7.5rem] p-4">
        <div className="flex h-full items-center gap-3">
          <PostVoteButtons
            postId={post.id}
            initialUpvotes={post.upvotes}
            initialUserVote={post.userVote}
          />

          <Link href={href} className="flex-1 min-w-0">
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">{post.category}</span>
              </div>

              <h3 className="truncate text-lg mb-1 font-semibold text-black hover:text-[#0f6f6b]">
                {post.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex min-w-0 items-center gap-1">
                  {post.avatar} {post.author}
                </span>
                <span>{post.timestamp}</span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={12} />
                  {post.comments} comments
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  {post.views} views
                </span>
              </div>
            </div>
          </Link>

          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            <PostModerationControls
              authorId={post.authorId}
              isBusy={isBusy}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
