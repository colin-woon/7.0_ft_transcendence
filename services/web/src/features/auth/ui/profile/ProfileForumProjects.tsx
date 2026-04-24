import React from "react";
import Link from "next/link";
import { Loader2, RefreshCw, ArrowRight } from "lucide-react";

export type SubscribedProject = {
  id: string | number;
  name: string;
  description?: string;
};

interface SubscribedProjectsCardProps {
  subscribedProjects: SubscribedProject[];
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
    <div className="card bg-base-100 shadow-md rounded-xl p-4 w-full h-full border border-transparent overflow-visible">
      <div className="w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Forum Projects</h2>
          <button 
            onClick={onRefresh} 
            disabled={isLoading}
            className="btn btn-ghost btn-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>

        {hasData && (
          /* p-1 here prevents the "lifting" effect from being clipped by the container edge */
          <div className="max-h-[400px] overflow-y-auto p-1 pr-2 space-y-3 w-full mt-3 scrollbar-thin scrollbar-thumb-slate-200">
            {subscribedProjects.map((project) => (
              <div
                key={project.id}
                className="group relative flex flex-col justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-slate-400 hover:shadow-lg active:scale-[0.98] md:active:scale-100 min-h-[75px]"
              >
                {/* Default State (Front) */}
                <div className="relative z-0 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-4 group-hover:pointer-events-none">
                  <span className="text-sm font-bold text-slate-800 block truncate pr-4">
                    {project.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                      Active Subscription
                    </span>
                  </div>
                </div>

                {/* Hover State (Back) - Fully Opaque to prevent "Bleeding" */}
                <div className="absolute inset-0 z-10 flex items-center justify-between px-4 opacity-0 transition-all duration-300 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 bg-white rounded-xl">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-[11px] font-semibold leading-snug text-slate-600 line-clamp-2 md:line-clamp-3">
                      {project.description || "Access discussions and project resources on the forum."}
                    </p>
                  </div>
                  
                  <Link
                    href={`/projects/${project.id}`}
                    className="shrink-0 flex items-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-slate-700 active:scale-90"
                  >
                    View
                    <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-2 rounded bg-rose-50 border border-rose-100 text-[11px] text-rose-500">
            {error}
          </div>
        )}

        {!hasData && !isLoading && !error && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-slate-400 italic">No project subscriptions found.</p>
          </div>
        )}
      </div>
    </div>
  );
}