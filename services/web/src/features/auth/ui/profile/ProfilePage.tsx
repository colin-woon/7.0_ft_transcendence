"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@/features/auth/api/authService";
import { useAdminUsers } from "@/features/auth/hooks/useAdminUsers";
import { useUserLookup } from "@/features/auth/hooks/useUserLookup";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { useAuth } from "@/features/auth/models/AuthContext";
import ConfirmActionDialog from "@/features/auth/ui/settings/components/ConfirmActionDialog";
import EditUserDialog, {
  type EditUserDraft,
} from "@/features/auth/ui/settings/components/EditUserDialog";
import UserAdminActionButtons from "@/features/auth/ui/shared/UserAdminActionButtons";
import {
  fileToDataUrl,
  validateAvatarFile,
} from "@/features/auth/utils/avatarFile";
import {
  extractAchievements,
  extractIntraSummary,
  extractSkills,
} from "@/features/auth/utils/intraDataParser";
import { getUserInitials } from "@/features/auth/utils/userInitials";
import { useProfileProjects } from "@/features/forum/hooks/useProfileProjects";
import ProfileCard from "./ProfileCard";
import ProfileCard2 from "./ProfileCard2";
import AchievementCard from "./AchievementCard";
import ProjectsCard from "./ProjectsCard";
import SkillsCard from "./SkillsCard";
import SubscribedProjectsCard from "./ProfileForumProjects";


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
  const { user, isLoading: authLoading, error: authError, hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const viewingOwnProfile = !viewedUserId || viewedUserId === user?.id;
  const {
    updateUser,
    logoutUser,
    deleteUser,
    loading: adminLoading,
    error: adminError,
  } = useAdminUsers();
  const { lookup } = useUserLookup({ cacheTtlMs: 5_000 });

  const [quickActionError, setQuickActionError] = useState<string | null>(null);
  const [confirmForceLogoutOpen, setConfirmForceLogoutOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<"STUDENT" | "ADMIN">(
    "STUDENT",
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [editRole, setEditRole] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [editBanned, setEditBanned] = useState(false);
  const [editDraft, setEditDraft] = useState<EditUserDraft>({
    username: "",
    fullName: "",
    bio: "",
  });

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

  const cursusSkills = useMemo(() => {
    const raw = (activeProfile?.intraInfo?.cursusUsers ?? []);
    // Find the main cursus (or whatever logic you want)
    const mainCursus = raw.find((c: any) => c.kind === "main" || c.cursus_id === 21);
    if (!mainCursus || !Array.isArray(mainCursus.skills)) return [];
    return mainCursus.skills.map((s: any) => ({
      id: s.id,
      name: s.name,
      level: s.level,
    }));
  }, [activeProfile?.intraInfo]);

  const skills = useMemo(
    () =>
      activeProfile?.intraInfo
        ? extractSkills(activeProfile.intraInfo).slice(0, 8)
        : [],
    [activeProfile?.intraInfo],
  );

  interface IntraProject {
    project: {
      id: number;
      name: string;
    };
    updated_at: string;
    final_mark: number | null;
    status: string;
  }

  const projects = useMemo(() => {
      const raw = (activeProfile?.intraInfo?.projectsUsers as unknown as IntraProject[]) ?? [];
      
      const deduped = Object.values(
        raw.reduce((acc, p) => {
          const key = p.project.id;
          // Now p.updated_at is recognized as a string
          if (!acc[key] || new Date(p.updated_at).getTime() > new Date(acc[key].updated_at).getTime()) {
            acc[key] = p;
          }
          return acc;
        }, {} as Record<number, IntraProject>)
      );

      return deduped
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 8)
        .map(p => ({
          name: p.project.name,
          score: p.final_mark,
          status: p.status,
        }));
    }, [activeProfile?.intraInfo]);

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
  const {
    subscribedProjects,
    suggestedProjects,
    loading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProfileProjects({
    enabled: Boolean(user),
    subscriptionUserId: viewingOwnProfile ? null : (activeProfile?.id ?? null),
  });

  const openAdminEditDialog = async () => {
    if (
      !activeProfile?.id ||
      !isAdmin ||
      (user && activeProfile.id === user.id)
    ) {
      return;
    }

    const detailed = await lookup(activeProfile.id, true);
    if (!detailed) return;

    setEditDraft({
      username: detailed.username,
      fullName: detailed.fullName,
      bio: detailed.bio ?? "",
    });
    setEditRole(detailed.role);
    setEditBanned(detailed.isBanned);
    setPendingAvatarFile(null);
    setQuickActionError(null);
    setEditOpen(true);
  };

  const saveAdminEdit = async () => {
    if (!activeProfile?.id) return;

    if (pendingAvatarFile) {
      const validationError = validateAvatarFile(pendingAvatarFile);
      if (validationError) {
        setQuickActionError(validationError);
        return;
      }
    }

    const avatarFile = pendingAvatarFile
      ? await fileToDataUrl(pendingAvatarFile)
      : undefined;

    const updated = await updateUser(activeProfile.id, {
      username: editDraft.username.trim() || undefined,
      fullName: editDraft.fullName.trim() || undefined,
      bio: editDraft.bio.trim(),
      avatarFile,
    });

    if (!updated) {
      setQuickActionError(`Failed to update @${activeProfile.username}`);
      return;
    }

    setPendingAvatarFile(null);
    setEditRole(updated.role);
    setEditBanned(updated.isBanned);
    setEditOpen(false);
    setQuickActionError(null);
    await refetch();
  };

  const applyUserAdminPatch = async (patch: {
    role?: "STUDENT" | "ADMIN";
    isBanned?: boolean;
  }) => {
    if (!activeProfile?.id) return;

    const updated = await updateUser(activeProfile.id, patch);
    if (!updated) return;

    setEditRole(updated.role);
    setEditBanned(updated.isBanned);
    setEditDraft((prev) => ({
      ...prev,
      username: updated.username,
      fullName: updated.fullName,
      bio: updated.bio ?? "",
    }));
    await refetch();
  };

  const runDeleteUser = async () => {
    if (!activeProfile?.id) return;

    setConfirmLoading(true);
    setQuickActionError(null);
    try {
      const ok = await deleteUser(activeProfile.id);
      if (!ok) {
        setQuickActionError(`Failed to delete @${activeProfile.username}`);
      } else {
        setEditOpen(false);
        router.push("/search");
      }
    } finally {
      setConfirmLoading(false);
      setConfirmDeleteOpen(false);
    }
  };

  const runRoleChange = async () => {
    if (!activeProfile?.id) return;

    setConfirmLoading(true);
    setQuickActionError(null);
    try {
      const updated = await updateUser(activeProfile.id, {
        role: pendingRole,
      });

      if (!updated) {
        setQuickActionError(
          `Failed to change role for @${activeProfile.username}`,
        );
        return;
      }

      setEditRole(updated.role);
      setEditBanned(updated.isBanned);
      setEditDraft((prev) => ({
        ...prev,
        username: updated.username,
        fullName: updated.fullName,
        bio: updated.bio ?? "",
      }));
      await refetch();
    } finally {
      setConfirmLoading(false);
      setConfirmRoleOpen(false);
    }
  };

  const runForceLogout = async () => {
    if (!activeProfile?.id) return;

    setConfirmLoading(true);
    setQuickActionError(null);
    try {
      const ok = await logoutUser(activeProfile.id);
      if (!ok) {
        setQuickActionError(
          `Failed to force logout @${activeProfile.username}`,
        );
      }
    } finally {
      setConfirmLoading(false);
      setConfirmForceLogoutOpen(false);
    }
  };

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
    wallet: intraSummary?.wallet ?? 0,
    evalPoints: intraSummary?.correctionPoints ?? 0,
    partnerships: partnershipsCount,
    groups: groupsCount,
    isAlumni: intraSummary?.isAlumni ?? false,
    pool: activeProfile?.intraInfo?.poolMonth && activeProfile?.intraInfo?.poolYear
      ? `${activeProfile.intraInfo.poolMonth} ${activeProfile.intraInfo.poolYear}`
      : "N/A",
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
      {(authError || profileError || quickActionError || adminError) && (
        <div className="bg-red-50 text-red-700 rounded-2xl border border-red-200 p-4 text-sm inline-flex items-start gap-2 w-full">
          <AlertCircle size={16} className="mt-0.5" />
          <span>
            {quickActionError ?? adminError ?? authError ?? profileError}
          </span>
        </div>
      )}

      <ProfileCard2
        user={activeProfile}
        profile={profileCardData}
        initials={initials}
        adminActions={
          isAdmin && user && activeProfile.id !== user.id ? (
            <UserAdminActionButtons
              disabled={adminLoading}
              editAriaLabel={`Edit profile ${activeProfile.username}`}
              forceLogoutAriaLabel={`Force logout ${activeProfile.username}`}
              onEdit={() => void openAdminEditDialog()}
              onForceLogout={() => setConfirmForceLogoutOpen(true)}
            />
          ) : undefined
        }
      />

      <SubscribedProjectsCard
        subscribedProjects={subscribedProjects}
        isLoading={projectsLoading}
        error={projectsError}
        onRefresh={refetchProjects}
      />
      
      <div className="flex flex-col md:flex-row gap-5">
        <div className="w-full md:w-1/2">
          <SkillsCard skills={cursusSkills} />
        </div>
        <div className="w-full md:w-1/2">
          <AchievementCard achievements={achievements} />
        </div>
      </div>

      <ProjectsCard projects={projects} />

      

        {/* 42 Card: Show extended Intra metadata beyond the primary identity/profile card. 
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 42 card: extended Intra metadata beyond the primary identity profile card. */}
        {/*
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
                  <div className="text-slate-500">Partnerships</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {partnershipsCount}
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
                  <div className="text-slate-500">Groups</div>
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {groupsCount}
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
                  <div className="max-h-24 overflow-y-auto pr-1">
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
                  <div className="max-h-44 overflow-y-auto pr-1">
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
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                  Skills & Languages
                </h3>
                {skills.length > 0 || languageNames.length > 0 ? (
                  <div className="max-h-24 overflow-y-auto pr-1">
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
                    </div>
                  </div>
                ) : null}
                {skills.length === 0 && languageNames.length === 0 ? (
                  <span className="text-sm text-slate-500">
                    No skills or languages available.
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
          */}
        {/* Debug/Test Card: Show all intra fields for verification */}
        {/*
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-yellow-900">
                Intra Data Debug Card
              </h2>
              <p className="text-xs text-yellow-700 mt-1">
                Raw values for wallet, correctionPoints, partnerships, isAlumni, pool, groups.
              </p>
            </div>
          </div>
          {hasIntraData ? (
            <div className="mt-4 space-y-2 text-sm text-yellow-900">
              <div><b>url:</b> {String(activeProfile?.intraInfo?.url)}</div>
              <div><b>phone:</b> {String(activeProfile?.intraInfo?.phone)}</div>
              <div><b>kind:</b> {String(activeProfile?.intraInfo?.kind)}</div>
              <div><b>image:</b> {JSON.stringify(activeProfile?.intraInfo?.image)}</div>
              <div><b>correctionPoints:</b> {String(activeProfile?.intraInfo?.correctionPoints)}</div>
              <div><b>poolMonth:</b> {String(activeProfile?.intraInfo?.poolMonth)}</div>
              <div><b>poolYear:</b> {String(activeProfile?.intraInfo?.poolYear)}</div>
              <div><b>location:</b> {String(activeProfile?.intraInfo?.location)}</div>
              <div><b>wallet:</b> {String(activeProfile?.intraInfo?.wallet)}</div>
              <div><b>isAlumni:</b> {String(activeProfile?.intraInfo?.isAlumni)}</div>
              <div><b>isActive:</b> {String(activeProfile?.intraInfo?.isActive)}</div>
              <div><b>groups:</b> {JSON.stringify(activeProfile?.intraInfo?.groups)}</div>
              <div><b>cursusUsers:</b> {JSON.stringify(activeProfile?.intraInfo?.cursusUsers)}</div>
              <div><b>projectsUsers:</b> {JSON.stringify(activeProfile?.intraInfo?.projectsUsers)}</div>
              <div><b>languagesUsers:</b> {JSON.stringify(activeProfile?.intraInfo?.languagesUsers)}</div>
              <div><b>achievements:</b> {JSON.stringify(activeProfile?.intraInfo?.achievements)}</div>
              <div><b>titles:</b> {JSON.stringify(activeProfile?.intraInfo?.titles)}</div>
              <div><b>titlesUsers:</b> {JSON.stringify(activeProfile?.intraInfo?.titlesUsers)}</div>
              <div><b>partnerships:</b> {JSON.stringify(activeProfile?.intraInfo?.partnerships)}</div>
              <div><b>patroned:</b> {JSON.stringify(activeProfile?.intraInfo?.patroned)}</div>
              <div><b>patroning:</b> {JSON.stringify(activeProfile?.intraInfo?.patroning)}</div>
              <div><b>expertisesUsers:</b> {JSON.stringify(activeProfile?.intraInfo?.expertisesUsers)}</div>
              <div><b>roles:</b> {JSON.stringify(activeProfile?.intraInfo?.roles)}</div>
              <div><b>campus:</b> {JSON.stringify(activeProfile?.intraInfo?.campus)}</div>
              <div><b>campusUsers:</b> {JSON.stringify(activeProfile?.intraInfo?.campusUsers)}</div>
            </div>
          ) : (
            <div className="mt-4 text-yellow-700">No intra data available.</div>
          )}
        </div>
        */}

        {/* Forum projects card: subscriptions and high-signal project suggestions. */}
        {/*} Note: this is separate from the main Intra data card because it relies on our own backend data and logic rather than just being a reflection of Intra details. 
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Projects</h2>
              <p className="text-xs text-slate-500 mt-1">
                Current subscriptions and suggested forum projects.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetchProjects()}
              className="btn btn-xs btn-ghost"
            >
              Refresh
            </button>
          </div>

          {projectsLoading ? (
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
                    {viewingOwnProfile
                      ? "You are not subscribed to any projects yet."
                      : "No subscribed projects were detected for this user."}
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
        */}

      <EditUserDialog
        open={editOpen}
        title="Edit user profile"
        draft={editDraft}
        saving={adminLoading}
        error={quickActionError ?? adminError}
        showAvatarUpload
        avatarFileName={pendingAvatarFile?.name ?? null}
        onAvatarFileChange={setPendingAvatarFile}
        extraActions={
          isAdmin && activeProfile?.id ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => {
                  setPendingRole(editRole === "ADMIN" ? "STUDENT" : "ADMIN");
                  setConfirmRoleOpen(true);
                }}
                disabled={adminLoading}
              >
                {editRole === "ADMIN" ? "Make student" : "Make admin"}
              </button>

              <button
                type="button"
                className="btn btn-xs btn-warning"
                onClick={() =>
                  void applyUserAdminPatch({
                    isBanned: !editBanned,
                  })
                }
                disabled={adminLoading}
              >
                {editBanned ? "Unban" : "Ban"}
              </button>

              <button
                type="button"
                className="btn btn-xs btn-error"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={adminLoading}
              >
                Delete user
              </button>
            </div>
          ) : null
        }
        onChange={(next) => setEditDraft((prev) => ({ ...prev, ...next }))}
        onClose={() => setEditOpen(false)}
        onSubmit={saveAdminEdit}
      />

      <ConfirmActionDialog
        open={confirmForceLogoutOpen}
        title={
          activeProfile
            ? `Force logout @${activeProfile.username}`
            : "Force logout"
        }
        message="This revokes all active sessions for the user."
        confirmLabel="Force logout"
        tone="warning"
        loading={confirmLoading || adminLoading}
        onClose={() => setConfirmForceLogoutOpen(false)}
        onConfirm={runForceLogout}
      />

      <ConfirmActionDialog
        open={confirmDeleteOpen}
        title={
          activeProfile ? `Delete @${activeProfile.username}` : "Delete user"
        }
        message="This permanently deletes the user account."
        confirmLabel="Delete"
        tone="danger"
        loading={confirmLoading || adminLoading}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={runDeleteUser}
      />

      <ConfirmActionDialog
        open={confirmRoleOpen}
        title={
          activeProfile
            ? `${pendingRole === "ADMIN" ? "Make" : "Demote"} @${activeProfile.username}`
            : "Confirm role change"
        }
        message={
          pendingRole === "ADMIN"
            ? "This grants administrator privileges to this user."
            : "This removes administrator privileges from this user."
        }
        confirmLabel={pendingRole === "ADMIN" ? "Make admin" : "Make student"}
        tone="warning"
        loading={confirmLoading || adminLoading}
        onClose={() => setConfirmRoleOpen(false)}
        onConfirm={runRoleChange}
      />
    </div>
  );
}
