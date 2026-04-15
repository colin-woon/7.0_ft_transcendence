import Link from 'next/link';
import { Plus } from 'lucide-react';

interface CreatePostButtonProps {
  projectId: number;
}

export default function CreatePostButton({ projectId }: CreatePostButtonProps) {
  return (
    <Link
      href={`/projects/${projectId}/create`}
      aria-label="Create post"
      title="Create post"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f6f6b] text-white transition hover:bg-[#0c5d5a]"
    >
      <Plus size={18} />
    </Link>
  );
}
