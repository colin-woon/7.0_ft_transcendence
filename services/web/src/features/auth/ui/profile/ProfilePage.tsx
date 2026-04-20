"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { User } from "@/features/auth/api/authService";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { useAuth } from "@/features/auth/models/AuthContext";
import {
  extractAchievements,
  extractIntraSummary,
  extractSkills,
} from "@/features/auth/utils/intraDataParser";
import { getUserInitials } from "@/features/auth/utils/userInitials";
import { useProfileProjects } from "@/features/forum/hooks/useProfileProjects";
import ProfileCard from "./ProfileCard";

interface ProfilePageProps {
  viewedUserId?: number;
  initialProfile?: User | null;
  initialProfileError?: string | null;
  initialProfileErrorStatus?: number | null;
}

function collectNames(
  values: unknown,
  accessor: (entry: unknown) => string | null,
): string[] {
  if (!Array.isArray(values)) return [];

  const unique = new Set<string>();
  for (const entry of values) {
    const next = accessor(entry)?.trim();
    if (next) {
      unique.add(next);
    }
  }

  return Array.from(unique);
}

function readProperty(source: unknown, key: string): unknown {
  if (!source || typeof source !== "object") return null;
  return (source as Record<string, unknown>)[key] ?? null;
}

/**
 * Lightweight profile route that presents identity details and routes users to settings for all account operations.
 */
export default function ProfilePage({
  viewedUserId,
  initialProfile,
  initialProfileError,
  initialProfileErrorStatus,
}: ProfilePageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const viewingOwnProfile = !viewedUserId || viewedUserId === user?.id;

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    errorStatus: profileErrorStatus,
    refetch,
  } = useUserProfile(viewedUserId, {
    skip: !user || (!!viewedUserId && viewedUserId <= 0),
    initialProfile,
    initialError: initialProfileError,
    initialErrorStatus: initialProfileErrorStatus,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const activeProfile = profile ?? (viewingOwnProfile ? user : null);

  const initials = useMemo(() => {
    return getUserInitials(activeProfile?.fullName);
  }, [activeProfile]);

  const intraSummary = activeProfile?.intraInfo
    ? extractIntraSummary(activeProfile.intraInfo)
    : null;

  const hasIntraData = Boolean(
    activeProfile?.linkedWithIntra && activeProfile?.intraInfo,
  );

  const achievements = useMemo(
    () =>
      activeProfile?.intraInfo
        ? extractAchievements(activeProfile.intraInfo).slice(0, 8)
        : [],
    [activeProfile?.intraInfo],
  );

  const skills = useMemo(
    () =>
      activeProfile?.intraInfo
        ? extractSkills(activeProfile.intraInfo).slice(0, 8)
        : [],
    [activeProfile?.intraInfo],
  );

  const titleNames = useMemo(
    () =>
      activeProfile?.intraInfo
        ? collectNames(activeProfile.intraInfo.titlesUsers, (entry) => {
            const title = readProperty(entry, "title");
            return typeof title === "object"
              ? String(readProperty(title, "name") ?? "")
              : String(title ?? "");
          }).slice(0, 8)
        : [],
    [activeProfile?.intraInfo],
  );

  const languageNames = useMemo(
    () =>
      activeProfile?.intraInfo
        ? collectNames(activeProfile.intraInfo.languagesUsers, (entry) => {
            const language = readProperty(entry, "language");
            return typeof language === "object"
              ? String(readProperty(language, "name") ?? "")
              : String(language ?? "");
          }).slice(0, 8)
        : [],
    [activeProfile?.intraInfo],
  );

  const groupsCount = Array.isArray(activeProfile?.intraInfo?.groups)
    ? activeProfile.intraInfo.groups.length
    : 0;
  const partnershipsCount = Array.isArray(
    activeProfile?.intraInfo?.partnerships,
  )
    ? activeProfile.intraInfo.partnerships.length
    : 0;
  const patronedCount = Array.isArray(activeProfile?.intraInfo?.patroned)
    ? activeProfile.intraInfo.patroned.length
    : 0;
  const patroningCount = Array.isArray(activeProfile?.intraInfo?.patroning)
    ? activeProfile.intraInfo.patroning.length
    : 0;

  const {
    subscribedProjects,
    suggestedProjects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProfileProjects(viewingOwnProfile && Boolean(user));

  const profileCardData = {
    level: intraSummary?.level ?? 0,
    levelProgress: intraSummary?.levelProgress ?? 0,
    cursus: intraSummary?.activeCursus ?? "Not linked to 42 cursus",
    coalition: intraSummary?.campus?.name ?? "N/A",
    email: activeProfile?.email ?? "",
    location: intraSummary?.location ?? "",
    since: activeProfile?.createdAt
      ? new Date(activeProfile.createdAt).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
      : "Unknown",
  };

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={14} className="animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={14} className="animate-spin" />
          Redirecting to login...
        </div>
      </div>
    );
  }

  if (!viewingOwnProfile && profileErrorStatus === 404) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">User not found</h2>
          <p className="text-sm text-slate-500 mt-2">
            The requested profile does not exist or is no longer available.
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Back to my profile
          </button>
        </div>
      </div>
    );
  }

  if (!viewingOwnProfile && profileErrorStatus === 403) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">Access denied</h2>
          <p className="text-sm text-slate-500 mt-2">
            You do not have permission to view this user profile.
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Back to my profile
          </button>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Profile unavailable
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            We could not load this profile right now.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back to my profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 p-4">
      {(authError || profileError) && (
        <div className="bg-red-50 text-red-700 rounded-2xl border border-red-200 p-4 text-sm inline-flex items-start gap-2 w-full">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{authError ?? profileError}</span>
        </div>
      )}

      <ProfileCard
        user={activeProfile}
        profile={profileCardData}
        initials={initials}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 42 card: extended Intra metadata beyond the primary identity profile card. */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                42 Additional Info
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Achievements, titles, skills, and account stats from 42 Intra.
              </p>
            </div>
          </div>

          {!hasIntraData ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Log into 42 to load additional Intra details for this profile.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Wallet</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {intraSummary?.wallet ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Eval Points</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {intraSummary?.correctionPoints ?? 0}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Active</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {intraSummary?.isActive ? "Yes" : "No"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Alumni</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {intraSummary?.isAlumni ? "Yes" : "No"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Pool</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {activeProfile?.intraInfo?.poolMonth &&
                    activeProfile?.intraInfo?.poolYear
                      ? `${activeProfile.intraInfo.poolMonth} ${activeProfile.intraInfo.poolYear}`
                      : "N/A"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Phone</div>
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {intraSummary?.phone ?? "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Groups</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {groupsCount}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Partnerships</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {partnershipsCount}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Patroned</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {patronedCount}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-slate-500">Patroning</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {patroningCount}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Titles
                </h3>
                {titleNames.length === 0 ? (
                  <p className="text-sm text-slate-500">No titles available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {titleNames.map((title) => (
                      <span
                        key={title}
                        className="text-xs px-2 py-1 rounded-full bg-[#8EE7E3]/20 text-[#0f6f6b]"
                      >
                        {title}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Achievements
                </h3>
                {achievements.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No achievements available.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {achievements.map((achievement) => (
                      <li
                        key={achievement.id}
                        className="rounded-xl border border-slate-200 p-2"
                      >
                        <div className="text-sm font-semibold text-slate-900">
                          {achievement.name}
                        </div>
                        {achievement.description ? (
                          <p className="text-xs text-slate-500 mt-1">
                            {achievement.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Skills & Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700"
                    >
                      {skill.name} ({skill.level.toFixed(2)})
                    </span>
                  ))}
                  {languageNames.map((language) => (
                    <span
                      key={language}
                      className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600"
                    >
                      {language}
                    </span>
                  ))}
                  {skills.length === 0 && languageNames.length === 0 ? (
                    <span className="text-sm text-slate-500">
                      No skills or languages available.
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Forum projects card: subscriptions and high-signal project suggestions. */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Projects</h2>
              <p className="text-xs text-slate-500 mt-1">
                Current subscriptions and suggested forum projects.
              </p>
            </div>
            {viewingOwnProfile ? (
              <button
                type="button"
                onClick={() => void refetchProjects()}
                className="btn btn-xs btn-ghost"
              >
                Refresh
              </button>
            ) : null}
          </div>

          {!viewingOwnProfile ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Project subscriptions are only shown on your own profile.
            </div>
          ) : projectsLoading ? (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
              <Loader2 size={14} className="animate-spin" />
              Loading project data...
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {projectsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {projectsError}
                </div>
              ) : null}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Subscribed Projects
                </h3>
                {subscribedProjects.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    You are not subscribed to any projects yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {subscribedProjects.map((project) => (
                      <li
                        key={project.id}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {project.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {project.description}
                            </p>
                          </div>
                          <Link
                            href={`/projects/${project.id}`}
                            className="btn btn-xs btn-outline"
                          >
                            Open
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Suggested Projects
                </h3>
                {suggestedProjects.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No suggestions available right now.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {suggestedProjects.map((project) => (
                      <li
                        key={project.id}
                        className="rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {project.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {project.difficulty} · {project.xp} xp
                            </p>
                          </div>
                          <Link
                            href={`/projects/${project.id}`}
                            className="btn btn-xs btn-neutral"
                          >
                            View Forum
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!viewingOwnProfile && profileError && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-sm text-slate-600">
          <p>Failed to refresh this profile.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 btn btn-xs btn-ghost"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
