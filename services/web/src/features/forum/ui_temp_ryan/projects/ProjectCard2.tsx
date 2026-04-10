import { Project } from "@/features/forum/models/projects";
import Link from "next/link";
import { MessageSquare, Users, Zap } from "lucide-react";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const questionCount = project.postCount ?? project.posts.length;

  const difficultyTone =
    project.difficulty === "Beginner"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : project.difficulty === "Intermediate"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : project.difficulty === "Advanced"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div
      className="group relative block w-full max-w-[200px] aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transform-gpu transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.015] hover:border-slate-400 hover:shadow-2xl"
    >
      {/* Default state */}
      <div className="flex h-full flex-col items-center -translate-y-5 justify-center p-3 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0 group-hover:scale-95 group-hover:-translate-y-1">
        <h3 className="text-center text-base font-bold tracking-tight text-slate-800">
          {project.name}
        </h3>
      </div>

      <div className="absolute inset-0 z-10 flex h-full flex-col -translate-y-5 bg-white/95 p-3 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100">
        <div className="flex-1 flex items-center justify-center">
          <p className="line-clamp-5 text-center text-xs font-medium leading-relaxed text-slate-800">
            {project.description}
          </p>
        </div>
      </div>

      {/* Front state: stats and badge */}
      <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 flex items-end justify-between transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-1">
        <div className={`rounded-[7px] border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] ${difficultyTone}`}>
          {project.difficulty}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Zap size={8} className="text-amber-400 opacity-80" />
            {project.xp} XP
          </span>
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <MessageSquare size={8} />
            {questionCount} question{questionCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-slate-400">
            <Users size={8} />
            {project.students} students
          </span>
        </div>
      </div>

      {/* Back state: button — fade IN on hover */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex items-center justify-center opacity-0 transition-all duration-300 delay-100 group-hover:opacity-100 group-hover:pointer-events-auto">
         <Link href={`/projects/${project.id}`} className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-transparent px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors duration-300 hover:bg-slate-900 hover:text-white active:scale-95">
            View Project
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
      </div>
    </div>
  );
}