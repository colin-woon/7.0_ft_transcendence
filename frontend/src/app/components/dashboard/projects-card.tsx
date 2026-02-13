"use client"

import { useState } from "react"
import { ChevronRight, Check, X, Clock } from "lucide-react"

interface Project {
  id: string
  name: string
  status: "completed" | "failed" | "in-progress"
  score?: number
  children?: Project[]
}

interface ProjectsCardProps {
  projects: Project[]
}

const tabs = ["Projects", "Evaluation Logs", "Feedback Logs", "Quests"]

export function ProjectsCard({ projects }: ProjectsCardProps) {
  const [activeTab, setActiveTab] = useState("Projects")

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Projects</h3>
        
        <div className="flex gap-2">
          {tabs.slice(1).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "border-primary bg-primary text-white"
                  : "border-primary text-primary hover:bg-primary/10"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {projects.map((project) => (
          <ProjectItem key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}

function ProjectItem({ project, depth = 0 }: { project: Project; depth?: number }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <div
        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 ${
          depth > 0 ? "ml-6" : ""
        }`}
      >
        {project.children && project.children.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 items-center justify-center text-gray-400"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        )}
        
        {project.status === "completed" && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
            <Check className="h-3 w-3 text-primary" />
          </div>
        )}
        {project.status === "failed" && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
            <X className="h-3 w-3 text-red-500" />
          </div>
        )}
        {project.status === "in-progress" && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
            <Clock className="h-3 w-3 text-amber-500" />
          </div>
        )}

        <span className={`flex-1 text-sm ${
          project.status === "completed" ? "text-primary font-medium" : "text-gray-700"
        }`}>
          {project.name}
        </span>

        {project.score !== undefined && (
          <span className="text-xs font-medium text-gray-500">{project.score}%</span>
        )}
      </div>

      {expanded && project.children && project.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {project.children.map((child) => (
            <ProjectItem key={child.id} project={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
