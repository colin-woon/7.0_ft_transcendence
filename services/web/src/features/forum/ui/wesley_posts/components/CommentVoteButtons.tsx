'use client';

import { useState } from 'react';
import { voteOnComment } from '@/features/forum/api/post';

interface CommentVoteButtonsProps {
  postId: number;
  commentId: number;
  initialUpvotes: number;
}

export default function CommentVoteButtons({ postId, commentId, initialUpvotes }: CommentVoteButtonsProps) {
  // Use local state to allow for 'Optimistic UI' updates
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (e: React.MouseEvent, value: 1 | -1) => {
    // prevent parent link/route from triggering
    e.preventDefault();
    e.stopPropagation();

    if (isVoting)
      return;

    const previousUpvotes = upvotes;
    setIsVoting(true);

    try {
      const newVoteCount = await voteOnComment(postId, commentId, value);
      setUpvotes(newVoteCount);
    }
    catch (error) {
      setUpvotes(previousUpvotes);
      console.error('Voting failed:', error);
      alert('Could not register your vote. Please try again.');
    }
    finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1 text-xs">
      <button
        type="button"
        onClick={(e) => handleVote(e, 1)}
        disabled={isVoting}
        className="hover:bg-gray-100 rounded p-1 transition-colors disabled:opacity-50"
        aria-label="Upvote comment"
      >
        ▲
      </button>
 
      <span className="font-medium text-black">{upvotes}</span>

      <button
        type="button"
        onClick={(e) => handleVote(e, -1)}
        disabled={isVoting}
        className="hover:bg-gray-100 rounded p-1 transition-colors disabled:opacity-50"
        aria-label="Downvote comment"
      >
        ▼
      </button>
    </div>
  );
}