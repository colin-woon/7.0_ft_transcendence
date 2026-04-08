"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Project, Difficulty } from "../../models/projects";
import { ProjectCard } from "./ProjectCard2";
import TextType from '@/components/react-bits/TextType';
import { AdminProjectCreateButton } from '@/features/forum/ui/projects/moderation';



export default function ProjectsPage({ projects, subscribedProjectIds, initialSearch = "" }:{ projects: Project[]; subscribedProjectIds: number[]; initialSearch?: string }) {
  const PAGE_SIZE = 20;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState<"All" | "Subscribed" | Difficulty>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [hydratedSubscribedIds, setHydratedSubscribedIds] = useState<number[]>(subscribedProjectIds);

  const filters: ("All" | "Subscribed" | Difficulty)[] = ["All", "Subscribed", "Beginner", "Intermediate", "Advanced", "Expert"];

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscribedProjects() {
      try {
        const response = await fetch('/api/forum/projects/me/subscriptions', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as Array<{ id: number }>;
        if (!cancelled) {
          setHydratedSubscribedIds(data.map((project) => project.id));
        }
      } catch {
        if (!cancelled) {
          setHydratedSubscribedIds([]);
        }
      }
    }

    loadSubscribedProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const trimmedSearch = search.trim();

      if (trimmedSearch.length >= 2) {
        nextParams.set("q", trimmedSearch);
      } else {
        nextParams.delete("q");
      }

      const currentParams = searchParams.toString();
      const nextParamsString = nextParams.toString();

      if (currentParams === nextParamsString) {
        return;
      }

      const nextUrl = nextParamsString ? `${pathname}?${nextParamsString}` : pathname;
      router.replace(nextUrl);
    }, 600);

    return () => clearTimeout(timer);
  }, [search, searchParams, pathname, router]);

  const subscribedIdSet = new Set(hydratedSubscribedIds);
  const filtered = projects.filter((project) => {
    const matchesFilter = filter === "All" || project.difficulty === filter;
    const normalizedSearch = search.trim().toLowerCase();

    if (filter === "Subscribed") {
      return subscribedIdSet.has(project.id);
    }

    if (normalizedSearch.length === 0) {
      return matchesFilter;
    }

    const matchesSearch =
      (project.name?.toLowerCase() || "").includes(normalizedSearch) ||
      (project.description?.toLowerCase() || "").includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedProjects = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans pt-[var(--navbar-height)] overflow-y-auto overflow-x-hidden">

      {/* Header */}
      <div className="card card-border bg-base-100 shadow-sm w-full max-w-full rounded-none sm:rounded-box">
        <div className="card-body px-4 sm:px-6 py-5">
          <TextType className="text-5xl text-slate-800 mb-4 font-interface tracking-wide uppercase"
            text="Cursus Projects"
            typingSpeed={75}
            pauseDuration={1500}
            showCursor
            cursorCharacter="_"
            deletingSpeed={50}
            variableSpeed={{ min: 60, max: 120 }}
            cursorBlinkDuration={0.5}
            loop={false}
            onSentenceComplete={() => {}}
          />
          <div>
            <TextType className="text-md font-interface"
            text={"Welcome to 42 Overflow! Where you can explore and discuss all the projects in the 42 curriculum :>"}
            typingSpeed={75}
            pauseDuration={1500}
            showCursor
            cursorCharacter="_"
            deletingSpeed={50}
            variableSpeed={{ min: 60, max: 120 }}
            cursorBlinkDuration={0.5}
            loop={false}
            initialDelay={2000}
            onSentenceComplete={() => {}}
          />
          </div>
          

          {/* Search bar and tabs row: flex on sm+, stacked on mobile */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center min-w-0">
            <div className="relative flex-1 max-w-md min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8EE7E3] bg-gray-50 hover:border-[#8EE7E3] hover:shadow"
              />
            </div>
            {/* Tabs: show in row on sm+, hide on mobile */}
            <div className="hidden sm:block">
              <div role="tablist" className="tabs tabs-box pl-4">
                {filters.map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    className={`tab ${filter === f ? "tab-active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:ml-auto self-end sm:self-auto">
              <AdminProjectCreateButton />
            </div>
          </div>
        </div>
      </div>

        {/* Tabs: show below header card only on mobile */}
        <div className="block sm:hidden max-w-full">
           <div className="card card-border bg-base-100 shadow-sm w-full rounded-none">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <div role="tablist" className="tabs tabs-box pl-2 pr-2 w-max">
                  {filters.map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="tab"
                      className={`tab ${filter === f ? "tab-active" : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
          </div>
        </div>
        </div>
     

      {/* Grid */}
      <div className="p-4 sm:p-6 max-w-full">
        <p className="text-xs text-slate-400 mb-2 font-interface">Results: {filtered.length} project{filtered.length !== 1 ? "s" : ""}</p>

        <div className="mt-6 flex flex-col gap-8 pb-24 sm:pb-28">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {filtered.length > 0 && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs sm:text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#8EE7E3]"
              >
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-3 py-1.5 text-xs sm:text-sm border transition ${
                    currentPage === page
                      ? "border-[#0f6f6b] bg-[#0f6f6b] text-white"
                      : "border-gray-200 bg-white text-slate-700 hover:border-[#8EE7E3]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs sm:text-sm text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#8EE7E3]"
              >
                Next
              </button>
            </div>
          )}
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
