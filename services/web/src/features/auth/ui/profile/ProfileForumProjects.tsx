import React from "react";
import Link from "next/link";
import { Loader2, RefreshCw, ArrowRight, Sparkles, Zap } from "lucide-react";

// Updated type to match your hook's scoring logic
export type Project = {
  id: string | number;
  name: string;
  description?: string;
  difficulty?: string;
  xp?: number;
  students?: number;
  postCount?: number;
};

interface ForumProjectsCardProps {
  subscribedProjects: Project[];
  suggestedProjects: Project[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function ForumProjectsCard({
  subscribedProjects,
  suggestedProjects,
  isLoading,
  error,
  onRefresh,
}: ForumProjectsCardProps) {
  
  const renderProjectRow = (project: Project, isSuggested: boolean = false) => (
    <div
      key={project.id}
      className={`group relative flex flex-col justify-center overflow-hidden rounded-xl border bg-white p-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:shadow-lg active:scale-[0.98] md:active:scale-100 min-h-[75px] ${
        isSuggested ? "border-slate-100 hover:border-amber-200" : "border-slate-200 hover:border-slate-400"
      }`}
    >
      {/* Front State */}
      <div className="relative z-0 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-4 group-hover:pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 block truncate max-w-[160px]">
            {project.name}
          </span>
          {isSuggested && (
            <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-bold border border-amber-100 uppercase">
              Trending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {!isSuggested && <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            {isSuggested 
              ? `${project.difficulty || 'Discovery'} • ${project.xp || 0} XP` 
              : "Subscribed"}
          </span>
        </div>
      </div>

      {/* Hover State */}
      <div className="absolute inset-0 z-10 flex items-center justify-between px-4 opacity-0 transition-all duration-300 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 bg-white rounded-xl">
        <div className="min-w-0 flex-1 mr-3">
          <p className="text-[11px] font-semibold leading-snug text-slate-600 line-clamp-2">
            {project.description || `Join ${project.students || 0} students and ${project.postCount || 0} discussions.`}
          </p>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-white transition-all active:scale-90 ${
            isSuggested ? "bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-100" : "bg-slate-900 hover:bg-slate-700"
          }`}
        >
          Open <ArrowRight size={10} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="card bg-base-100 shadow-md rounded-xl p-4 w-full h-full border border-transparent overflow-visible">
      <div className="w-full flex flex-col h-full">
        <div className="flex items-center justify-between mb-1 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Forum Projects</h2>
          <button onClick={onRefresh} disabled={isLoading} className="btn btn-ghost btn-xs text-slate-400 hover:text-slate-600 transition-colors">
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          </button>
        </div>

        <div className="max-h-[500px] overflow-y-auto p-1 pr-2 mt-3 scrollbar-thin scrollbar-thumb-slate-200 pt-2">
          {/* Subscriptions */}
          <div className="space-y-3">
            {subscribedProjects.length > 0 ? (
              subscribedProjects.map(p => renderProjectRow(p, false))
            ) : (
              !isLoading && <p className="text-xs text-slate-400 italic px-1 py-2">No active subscriptions.</p>
            )}
          </div>

          {/* Sparkly Divider */}
          {suggestedProjects.length > 0 && (
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2"><Sparkles size={14} className="text-amber-400/70" /></span>
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-3 pb-2">
            {suggestedProjects.length > 0 && (
              <>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">Suggested for you</h3>
                {suggestedProjects.map(p => renderProjectRow(p, true))}
              </>
            )}
          </div>
        </div>

        {error && <div className="mt-4 p-2 rounded bg-rose-50 text-[11px] text-rose-500 border border-rose-100">{error}</div>}
      </div>
    </div>
  );
}