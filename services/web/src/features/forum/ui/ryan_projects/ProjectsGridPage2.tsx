"use client"
import React from "react"
import { ProjectCard } from "./ProjectCard2";
import { projects } from "../../models/projects";


// export default function ProjectsGrid() {



//     return (
//         <div>
//             <h1 className="text-2xl font-bold text-slate-900 mb-7">Projects Grid Page 2</h1>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center mt-4">
//                 {projects.map((project) => (
//                     <ProjectCard key={project.id} project={project} />
//                 ))}
//             </div>
//         </div>
//     );
// }


export default function ProjectsGrid() {
    return (
        <div className="min-h-screen bg-slate-50/50 px-6 py-12">
            <header className="mb-12 border-b border-slate-200 pb-8">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                    Projects
                </h1>
                <p className="mt-2 text-slate-500">
                   All 42 projects to explore.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </div>
    );
}

