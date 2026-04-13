import Link from "next/link";
import { Plus, Zap, MessageCircle, Users } from "lucide-react";
import type { Project } from "../../../models/projects";
import SubscriptionButton from "@/features/forum/ui/projects/components/SubscriptionButton";

export default function ProjectInfoCard({
  project,
  className,
}: {
  project: Project;
  className?: string;
}) {
  return (
    <div className={`w-64 shrink-0 space-y-3 ${className ?? ""}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">{project.name}</h2>
          {project.difficulty && (
            <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {project.difficulty}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
          {project.description}
        </p>

        {project.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="pt-3 pb-5">
          <div className="h-px w-full bg-gray-200" />
        </div>

        <div className="mx-auto grid w-full max-w-[220px] grid-cols-3 gap-2 text-center">
          <div className="py-1">
            <Zap className="mx-auto mb-1 h-4 w-4 text-yellow-500" />
            <p className="text-xs font-semibold text-gray-900">
              {project.xp ?? 0}xp
            </p>
          </div>
          <div className="py-1">
            <MessageCircle className="mx-auto mb-1 h-4 w-4 text-blue-500" />
            <p className="text-xs font-semibold text-gray-900">
              {project.posts?.length ?? 0} posts
            </p>
          </div>
          <div className="py-1">
            <Users className="mx-auto mb-1 h-4 w-4 text-slate-500" />
            <p className="text-xs font-semibold text-gray-900">
              {project.students ?? 0} students
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <SubscriptionButton projectId={project.id} />
        </div>
        <Link
          href={`/projects/${project.id}/create`}
          className="flex items-center justify-center gap-1.5 w-full bg-[#0f6f6b] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#0c5d5a] transition"
        >
          <Plus size={15} />
          Create Post
        </Link>
      </div>
    </div>
  );
}
