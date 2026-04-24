import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";


// Inside SubscribedProjectsCard.tsx


export type SubscribedProject = {
  id: string | number;
  name: string;
  description?: string;
};

interface SubscribedProjectsCardProps {
  subscribedProjects: SubscribedProject[]; // Renamed from 'projects'
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function SubscribedProjectsCard({
  subscribedProjects,
  isLoading,
  error,
  onRefresh,
}: SubscribedProjectsCardProps) {
  const hasData = subscribedProjects && subscribedProjects.length > 0;

  return (
    <div className="card bg-base-100 shadow-md rounded-xl p-4 w-full">
      <div className="w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Forum Projects</h2>
          <button onClick={onRefresh} className="btn btn-ghost btn-xs text-slate-400">
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>

        {hasData && (
          <div className="max-h-64 overflow-y-auto pr-1 space-y-2 w-full mt-3">
            {subscribedProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between bg-white border border-base-300 rounded-md p-2 gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-base-content truncate block">
                    {project.name}
                  </span>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{project.description}</p>
                </div>
                <Link href={`/projects/${project.id}`} className="btn btn-xs btn-outline h-7 text-[10px]">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}