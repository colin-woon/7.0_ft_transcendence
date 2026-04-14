'use client';

import { useState } from 'react';
import { voteOnComment } from '@/features/forum/api/post';
import { Smile, Frown } from 'lucide-react';

interface CommentVoteButtonsProps {
  postId: number;
  commentId: number;
  initialUpvotes: number;
  initialUserVote: 1 | -1 | 0;
}

export default function CommentVoteButtons({
  postId,
  commentId,
  initialUpvotes,
  initialUserVote,
}: CommentVoteButtonsProps) {
  // Use local state to allow for 'Optimistic UI' updates
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (e: React.MouseEvent, value: 1 | -1) => {
    // prevent parent link/route from triggering
    e.preventDefault();
    e.stopPropagation();

    if (isVoting) return;

    const previousUpvotes = upvotes;
    const previousUserVote = userVote;
    setIsVoting(true);

    try {
      const result = await voteOnComment(postId, commentId, value);
      setUpvotes(result.vote_score);
      setUserVote(result.user_vote);
    } catch (error) {
      setUpvotes(previousUpvotes);
      setUserVote(previousUserVote);
      console.error('Voting failed:', error);
      alert('Could not register your vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 text-xs">
      <button
        type="button"
        onClick={(e) => handleVote(e, 1)}
        disabled={isVoting}
        className={`hover:bg-gray-100 rounded p-1 transition-colors disabled:opacity-50 ${
          userVote === 1 ? 'text-orange-500' : 'text-gray-400'
        }`}
        aria-label="Upvote comment"
      >
        <Smile size={16} />
      </button>

      <span className="font-medium text-black">{upvotes}</span>

      <button
        type="button"
        onClick={(e) => handleVote(e, -1)}
        disabled={isVoting}
        className={`hover:bg-gray-100 rounded p-1 transition-colors disabled:opacity-50 ${
          userVote === -1 ? 'text-blue-600' : 'text-gray-400'
        }`}
        aria-label="Downvote comment"
      >
        <Frown size={16} />
      </button>
    </div>
  );
}
