import type { ForumPost, ForumViewMode } from '../../../model';
import VoteButtons from './VoteButtons';

interface PostRowProps {
  post: ForumPost;
  viewMode: ForumViewMode;
}

export default function PostRow({ post, viewMode }: PostRowProps) {
  return (
    <div
      className={`bg-white border border-gray-200 hover:border-gray-300 transition cursor-pointer ${
        viewMode === 'card' ? 'rounded-lg' : 'rounded-md'
      }`}
    >
      <div className={viewMode === 'card' ? 'p-4' : 'px-3 py-2'}>
        <div className="flex gap-3">
          <VoteButtons upvotes={post.upvotes} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {post.isPinned && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  Pinned
                </span>
              )}
              <span className="text-xs text-gray-500">{post.category}</span>
            </div>

            <h3
              className={`font-semibold hover:text-[#0f6f6b] ${
                viewMode === 'card' ? 'text-lg mb-1' : 'text-base mb-0.5'
              }`}
            >
              {post.title}
            </h3>


            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                {post.avatar} {post.author}
              </span>
              <span>{post.timestamp}</span>
              <span>💬 {post.comments} comments</span>
              <span>👁 {post.views} views</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
