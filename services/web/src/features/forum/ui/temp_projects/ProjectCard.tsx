import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Clock,
  Globe,
  MessageSquare,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { type Difficulty, type Project } from "../../models/projects";

const difficultyColor: Record<Difficulty, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-orange-100 text-orange-700",
  Expert: "bg-red-100 text-red-700",
};

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="bg-white rounded-xl border border-gray-200 hover:border-[#8EE7E3] hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer flex flex-col"
    >
      <div className={"h-1.5 w-full bg-gradient-to-r " + project.color} />

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{project.icon}</span>
            <div>
              <h3 className="font-semibold text-slate-800 text-sm group-hover:text-[#0f6f6b] transition-colors">
                {project.name}
              </h3>
              <span
                className={
                  "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 " +
                  difficultyColor[project.difficulty]
                }
              >
                {project.difficulty}
              </span>
            </div>
          </div>
          <Globe size={14} className="text-[#8EE7E3] mt-1 shrink-0" />
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1 line-clamp-3">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 bg-gray-100 text-slate-500 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <Zap size={11} className="text-amber-400" />
            <span className="font-medium text-slate-600">{project.xp} XP</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {project.duration}
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {project.teamSize}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Star size={10} className="text-yellow-400" />
              {project.students.toLocaleString()} students
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[#0f6f6b] font-medium">
              <MessageSquare size={10} />
              {project.posts.length} question{project.posts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-[#0f6f6b] opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}