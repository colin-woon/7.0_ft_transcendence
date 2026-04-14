import React from "react";

type Project = {
  name: string;
  status: string;
  score: number | null;
};

export default function ProfileProjectCard({ projects }: { projects: Project[] }) {
  return (
    <div className="w-full">
      <div className="card card-border bg-white/40 backdrop-blur-md w-full rounded-2xl border border-white/50 shadow-lg">
        <div className="card-body p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Recent Projects
          </p>
          <div className="space-y-2">
            {projects.map((project) => {
              let opacity = 10;
              if (project.score !== null) {
                opacity = Math.round(((project.score / 125) * 30) / 10) * 10;
              }
              const tealOpacityClass = `bg-[#8EE7E3]/${opacity}`;

              return (
                <div
                  key={project.name}
                  className={`flex items-center justify-between rounded-xl border border-slate-100 ${tealOpacityClass} px-3 py-2`}
                >
                  <p className="text-sm font-medium text-slate-800">{project.name}</p>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-white px-2 py-1 text-slate-500 border border-slate-200">
                      {project.status}
                    </span>
                    <span className="rounded-full bg-[#8EE7E3]/20 px-2 py-1 text-[#0f6f6b] border border-[#8EE7E3]/40">
                      {project.score !== null ? `${project.score}%` : "--"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}