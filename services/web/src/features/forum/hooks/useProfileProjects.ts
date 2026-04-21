"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/features/forum/models/projects";

interface ForumProjectListPage {
  items: unknown[];
  total_pages?: number;
}

interface UseProfileProjectsResult {
  subscribedProjects: Project[];
  suggestedProjects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseProfileProjectsOptions {
  enabled: boolean;
  subscriptionUserId?: number | null;
}

function mapDifficulty(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  const xp = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(xp) || xp <= 2000) return "Beginner";
  if (xp <= 10000) return "Intermediate";
  return "Advanced";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toProject(raw: unknown): Project {
  const source = asRecord(raw);

  if (
    typeof source.duration === "string" &&
    typeof source.teamSize === "string" &&
    Array.isArray(source.tags)
  ) {
    return source as unknown as Project;
  }

  const xp = Number(source.xp ?? 0);
  const studentsValue = Number(source.subscriber_count ?? source.students ?? 0);
  const postCountValue = Number(
    source.post_count ??
      (Array.isArray(source.posts) ? source.posts.length : 0),
  );
  const objectiveTags = Array.isArray(source.objectives)
    ? source.objectives.map((tag: unknown) => String(tag))
    : ["42"];

  return {
    id: Number(source.id ?? 0),
    slug: String(source.slug ?? ""),
    name: String(source.name ?? "Unknown Project"),
    description: String(source.description ?? "No description provided."),
    difficulty: mapDifficulty(source.difficulty ?? xp),
    xp: Number.isFinite(xp) ? xp : 0,
    duration: String(source.estimate_time ?? "~1 week"),
    teamSize: source.solo ? "Solo" : "Team",
    tags: objectiveTags,
    students: Number.isFinite(studentsValue) ? studentsValue : 0,
    postCount: Number.isFinite(postCountValue) ? postCountValue : 0,
    color: String(source.color ?? "from-blue-400 to-blue-600"),
    posts: Array.isArray(source.posts) ? source.posts : [],
  };
}

async function fetchProjectsPage(
  page: number,
  pageSize = 100,
): Promise<ForumProjectListPage> {
  const response = await fetch(
    `/api/forum/projects?page=${page}&page_size=${pageSize}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  const data = (await response.json()) as unknown;

  if (Array.isArray(data)) {
    return { items: data, total_pages: 1 };
  }

  const parsed = data as ForumProjectListPage;
  if (!Array.isArray(parsed.items)) {
    return { items: [], total_pages: 1 };
  }

  return parsed;
}

/**
 * Loads forum projects for profile widgets and derives subscribed/suggested slices.
 */
export function useProfileProjects({
  enabled,
  subscriptionUserId = null,
}: UseProfileProjectsOptions): UseProfileProjectsResult {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [subscribedIds, setSubscribedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!enabled) {
      if (requestId === requestIdRef.current) {
        setAllProjects([]);
        setSubscribedIds([]);
        setError(null);
        setLoading(false);
      }
      return;
    }

    if (requestId === requestIdRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const firstPage = await fetchProjectsPage(1);

      const totalPages = Math.max(1, Number(firstPage.total_pages ?? 1));
      let items = [...firstPage.items];

      if (totalPages > 1) {
        const extraPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            fetchProjectsPage(index + 2),
          ),
        );
        for (const page of extraPages) {
          items = items.concat(page.items);
        }
      }

      const mappedProjects = items.map((project) => toProject(project));
      const subscriptionsPath =
        typeof subscriptionUserId === "number" && subscriptionUserId > 0
          ? `/api/forum/projects/users/${subscriptionUserId}/subscriptions`
          : "/api/forum/projects/me/subscriptions";

      const subscriptionsResponse = await fetch(subscriptionsPath, {
        method: "GET",
        cache: "no-store",
      });

      if (!subscriptionsResponse.ok) {
        throw new Error("Failed to fetch subscribed projects");
      }

      const subscriptionData = (await subscriptionsResponse.json()) as Array<{
        id?: number;
        project_id?: number;
      }>;
      const nextSubscribedIds = subscriptionData
        .map((entry) => Number(entry.id ?? entry.project_id ?? 0))
        .filter((id) => Number.isFinite(id) && id > 0);

      if (requestId === requestIdRef.current) {
        setAllProjects(mappedProjects);
        setSubscribedIds(nextSubscribedIds);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load project data";
      if (requestId === requestIdRef.current) {
        setError(message);
        setAllProjects([]);
        setSubscribedIds([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, subscriptionUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  const subscribedProjects = useMemo(() => {
    const subscribedSet = new Set(subscribedIds);
    return allProjects.filter((project) => subscribedSet.has(project.id));
  }, [allProjects, subscribedIds]);

  const suggestedProjects = useMemo(() => {
    const subscribedSet = new Set(subscribedIds);
    return allProjects
      .filter((project) => !subscribedSet.has(project.id))
      .sort((a, b) => {
        const scoreA =
          (a.students ?? 0) + (a.postCount ?? 0) * 2 + (a.xp ?? 0) / 100;
        const scoreB =
          (b.students ?? 0) + (b.postCount ?? 0) * 2 + (b.xp ?? 0) / 100;
        return scoreB - scoreA;
      })
      .slice(0, 6);
  }, [allProjects, subscribedIds]);

  return {
    subscribedProjects,
    suggestedProjects,
    loading,
    error,
    refetch: load,
  };
}
