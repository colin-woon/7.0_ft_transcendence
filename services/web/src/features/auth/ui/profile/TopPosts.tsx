interface Post {
  title: string;
  upvotes: number;
  comments: number;
}

export default function TopPosts({ posts }: { posts: Post[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {posts.map((p) => (
        <div
          key={p.title}
          className="px-2.5 py-2 rounded-[8px] border border-base-300 bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
        >
          <p className="text-[11px] font-medium text-base-content leading-snug mb-1">{p.title}</p>
          <div className="flex gap-2 font-mono text-[9px] text-base-content/40">
            <span>↑ {p.upvotes}</span>
            <span>💬 {p.comments}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
