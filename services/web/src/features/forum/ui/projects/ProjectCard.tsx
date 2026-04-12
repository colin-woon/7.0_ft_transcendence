import React from 'react';
import { Zap, Clock, Users, Star, MessageSquare } from 'lucide-react';
import { projects } from '../../models/projects';

export default function ProjectCard({
  project,
}: {
  project: (typeof projects)[0];
}) {
  const questionCount = project.postCount ?? project.posts.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className={`h-2 w-full bg-gradient-to-r ${project.color}`} />
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* <span className="text-5xl">{project.icon}</span> */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">
                {project.name}
              </h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full `}>
                {project.difficulty}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {project.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-0.5 bg-gray-100 text-slate-500 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span className="font-semibold text-slate-700">
                  {project.xp}
                </span>{' '}
                XP
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {project.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={14} />
                {project.teamSize}
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={14} className="text-yellow-400" />
                {project.students.toLocaleString()} students
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare size={14} className="text-[#0f6f6b]" />
                {questionCount} question{questionCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
