import Link from 'next/link';

export default function EmptyPostsState() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#8EE7E3]/20 text-[#0f6f6b] flex items-center justify-center text-xl font-bold mx-auto mb-4">
        0
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">No posts yet</h3>
      <p className="text-sm text-slate-600 mb-5">Try a different search, or pick a project to create the first post.</p>
      <Link
        href="/projects"
        className="inline-flex items-center justify-center rounded-full bg-[#0f6f6b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0c5d5a]"
      >
        Browse projects
      </Link>
    </div>
  );
}
