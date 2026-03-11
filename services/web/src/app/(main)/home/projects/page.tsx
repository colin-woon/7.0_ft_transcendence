"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Search, Star, Users, Clock, ChevronRight, Zap, Globe, MessageSquare } from "lucide-react";
import { projects, type Difficulty } from "./data";

const difficultyColor: Record<Difficulty, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-orange-100 text-orange-700",
  Expert: "bg-red-100 text-red-700",
};

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | Difficulty>("All");

  const filters: ("All" | Difficulty)[] = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === "All" || p.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">42 Projects</h1>
        <p className="text-sm text-slate-500">Explore the full curriculum — from C basics to full-stack web apps.</p>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8EE7E3] bg-gray-50"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filter === f
                    ? "bg-[#0f6f6b] text-white"
                    : "bg-gray-100 text-slate-600 hover:bg-[#8EE7E3]/30"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        <p className="text-xs text-slate-400 mb-4">{filtered.length} project{filtered.length !== 1 ? "s" : ""}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/home/projects/${project.slug}`}
              className="bg-white rounded-xl border border-gray-200 hover:border-[#8EE7E3] hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer flex flex-col"
            >
              {/* Gradient strip */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${project.color}`} />

              <div className="p-4 flex flex-col flex-1">
                {/* Icon + name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{project.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm group-hover:text-[#0f6f6b] transition-colors">
                        {project.name}
                      </h3>
                      <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${difficultyColor[project.difficulty]}`}>
                        {project.difficulty}
                      </span>
                    </div>
                  </div>
                  <Globe size={14} className="text-[#8EE7E3] mt-1 shrink-0" />
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1 line-clamp-3">{project.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-slate-500 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
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

                {/* Footer */}
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
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm">No projects match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
