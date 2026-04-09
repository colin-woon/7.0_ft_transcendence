import React from 'react';

type Project = {
  name: string;
  status: string;
  score: number | null;
};

export default function ProfileProjectCard({ projects }: { projects: Project[] }) {
  return (
    <div className="w-full">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 w-full">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Recent Projects</p>
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.name}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <p className="text-sm font-medium text-slate-800">{project.name}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-white px-2 py-1 text-slate-500 border border-slate-200">
                  {project.status}
                </span>
                <span className="rounded-full bg-[#8EE7E3]/20 px-2 py-1 text-[#0f6f6b] border border-[#8EE7E3]/40">
                  {project.score !== null ? `${project.score}%` : '--'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}