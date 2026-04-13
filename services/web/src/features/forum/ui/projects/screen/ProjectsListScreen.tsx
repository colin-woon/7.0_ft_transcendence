"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Project, Difficulty } from "../../../models/projects";
import { AnimatedProjectsGrid } from "../../animations/AnimatedProjectsGrid";
import TextType from "@/components/react-bits/TextType";
import { AdminProjectCreateButton } from "@/features/forum/ui/moderation";
import { PaginationControls } from "../../shared/PaginationControls";
import ForumTrailButtons from "@/features/forum/ui/shared/ForumTrailButtons";

export default function ProjectsPage({
  projects,
  subscribedProjectIds,
  initialSearch = "",
}: {
  projects: Project[];
  subscribedProjectIds: number[];
  initialSearch?: string;
}) {
  const PAGE_SIZE = 20;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState<"All" | "Subscribed" | Difficulty>(
    "All",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [hydratedSubscribedIds, setHydratedSubscribedIds] =
    useState<number[]>(subscribedProjectIds);

  const filters: ("All" | "Subscribed" | Difficulty)[] = [
    "All",
    "Subscribed",
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert",
  ];

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubscribedProjects() {
      try {
        const response = await fetch("/api/forum/projects/me/subscriptions", {
          method: "GET",
          cache: "no-store",
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

      const nextUrl = nextParamsString
        ? `${pathname}?${nextParamsString}`
        : pathname;
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
  const pageKey = [
    filter,
    search.trim().toLowerCase(),
    String(currentPage),
  ].join("|");

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="flex min-h-full flex-col font-sans">
      <div className="sticky top-16 z-50">
        {/* Header */}
        <div className="card card-border shadow-xl w-full max-w-full rounded-none sm:rounded-box backdrop-blur-sm">
          <div className="card-body px-4 sm:px-6 py-4 sm:py-5 min-h-0 sm:min-h-[13rem] overflow-hidden">
            <TextType
              className="text-2xl sm:text-5xl leading-tight text-slate-800 font-interface tracking-wide uppercase break-words line-clamp-2 sm:line-clamp-none"
              text="Cursus Projects"
              typingSpeed={75}
              pauseDuration={1500}
              showCursor
              cursorCharacter="_"
              deletingSpeed={50}
              variableSpeed={{ min: 60, max: 120 }}
              cursorBlinkDuration={0.5}
              loop={false}
              initialDelay={500}
              onSentenceComplete={() => {}}
            />
            <div className="mt-2 sm:mt-0">
              <TextType
                className="text-xs sm:text-base leading-snug font-interface break-words line-clamp-2 sm:line-clamp-none"
                text={
                  "Welcome to 42 Overflow! Where you can explore and discuss all the projects in the 42 curriculum :>"
                }
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
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
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
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 pt-15 flex items-center justify-between gap-3">
        <ForumTrailButtons className="mb-0" items={[{ label: "Projects" }]} />
        <p className="text-xs text-slate-400 mb-0 text-right font-interface">
          Results: {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Grid */}
      <div className="sm:p-6 w-full">
        <div className="mt-0 flex flex-col gap-3 pb-10 sm:pb-10 w-full items-center">
          <AnimatedProjectsGrid
            pageKey={pageKey}
            projects={paginatedProjects}
          />
        </div>

        <div>
          {filtered.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
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
