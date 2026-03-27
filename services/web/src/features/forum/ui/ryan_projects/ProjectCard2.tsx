import { Project } from "@/features/forum/models/projects";
import Link from "next/link";

type ProjectCardProps = {
  project: Project;
};

// export function ProjectCard({ project }: ProjectCardProps) {
//   return (
//     <div className="group relative mx-auto w-full max-w-[260px] aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-500 ease-out hover:bg-gray-100 hover:border-gray-400">
//       <h3 className="absolute inset-0 flex items-center justify-center text-center text-lg font-semibold text-gray-800 transition-opacity duration-200 group-hover:opacity-0">
//         {project.name}
//       </h3>

//       <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/95 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
//         <p className="text-justify text-sm leading-relaxed text-gray-700">
//           {project.description}
//         </p>
//       </div>
//     </div>
//   );
// }

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group relative w-full max-w-[280px] aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transform-gpu transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.015] hover:border-slate-400 hover:shadow-2xl">
      {/* Default state */}
      <div className="flex h-full flex-col items-center justify-center p-6 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0 group-hover:scale-95 group-hover:-translate-y-1">
        <h3 className="text-center text-lg font-bold tracking-tight text-slate-800">
          {project.name}
        </h3>
      </div>

      <div className="absolute inset-0 flex h-full flex-col bg-white/95 p-6 opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100">
        <div className="flex flex-1 items-center justify-center">
          <p className="line-clamp-5 text-center text-sm font-medium leading-relaxed text-slate-800">
            {project.description}
          </p>
        </div>

        <div className="mt-auto flex justify-center pb-2 sm:pb-1.5 lg:pb-3 opacity-0 translate-y-2 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-[900ms]">
          <Link href={`/projects/${project.slug}`} className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-transparent px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 transition-colors duration-300 hover:bg-slate-900 hover:text-white active:scale-95">
            View Project
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}