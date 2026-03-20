interface VoteButtonsProps {
  upvotes: number;
}

export default function VoteButtons({ upvotes }: VoteButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-1 text-xs">
      <button type="button" className="hover:bg-gray-100 rounded p-1" aria-label="Upvote thread">
        ▲
      </button>
      <span className="font-medium">{upvotes}</span>
      <button type="button" className="hover:bg-gray-100 rounded p-1" aria-label="Downvote thread">
        ▼
      </button>
    </div>
  );
}
