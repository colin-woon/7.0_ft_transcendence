import React from "react";

type Project = {
  name: string;
  status: string;
  score: number | null;
};

const getScoreStyle = (score: number | null) => {
  if (score === null) return "bg-base-200 text-base-content/40 border-base-300";
  if (score >= 100) return "bg-success/10 text-success border-success/30";
  if (score >= 75)  return "bg-warning/10 text-warning border-warning/30";
  return "bg-error/10 text-error border-error/30";
};

export default function ProjectsCard({ projects }: { projects: Project[] }) {
  return (
    <div className="card bg-base-100 shadow-md rounded-xl p-4 flex flex-col md:flex-row items-center gap-5 w-full h-full">
      <div className="w-full">
        <h2 className="text-lg font-bold mb-3 text-slate-900">Recent Projects</h2>
        
        <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5 w-full">
          {projects.map((project) => {
            // Background opacity logic for the teal tint
            let opacity = 0.05;
            if (project.score !== null) {
              opacity = Math.max(0.05, (project.score / 125) * 0.35);
            }

            // DaisyUI Badge Logic
            const getStatusBadge = (status: string) => {
              const lowerStatus = status.toLowerCase();
              if (lowerStatus === "finished") return "badge-success";
              if (lowerStatus === "in_progress") return "badge-info";
              return "badge-ghost"; 
            };

            return (
              <div
                key={project.name}
                className="flex items-center justify-between rounded-md border border-base-300 px-3 py-1.5 transition-all"
                style={{ backgroundColor: `rgba(142, 231, 227, ${opacity})` }}
              >
                {/* Slimmed down: Name and Status on one line */}
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm font-semibold text-base-content truncate">
                    {project.name}
                  </span>
                  <div className={`badge badge-outline ${getStatusBadge(project.status)} text-[9px] h-4 px-1.5 font-bold uppercase shrink-0`}>
                    {project.status.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Compact Score Box */}
                <div className="font-mono text:sm text-slate-600 shrink-0 ml-4 tracking-tighter px-2">
                  {project.score !== null ? `${project.score}%` : "--"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}