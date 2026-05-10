"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type User } from "@/features/auth/api/authService";
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
import { updateProfileSchema } from "@/features/auth/validation/authSchemas";
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
import ForumProjectsCard from "./ProfileForumProjects";
import GlassInfoCard from "./GlassInfoCard";


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

  const groupsCount = activeProfile?.intraInfo?.groupsCount ?? 0;
  const partnershipsCount = activeProfile?.intraInfo?.partnershipsCount ?? 0;
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

  const editValidation = useMemo(
    () =>
      updateProfileSchema.safeParse({
        username: editDraft.username,
        fullName: editDraft.fullName,
        bio: editDraft.bio,
        avatarFile: pendingAvatarFile ? "placeholder" : "",
      }),
    [editDraft.bio, editDraft.fullName, editDraft.username, pendingAvatarFile],
  );
  const editValidationMessage = editValidation.success
    ? null
    : editValidation.error.issues[0]?.message || "Invalid input";

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
      const avatarFile = await fileToDataUrl(pendingAvatarFile);
      const validationError = validateAvatarFile(avatarFile);
      if (validationError) {
        setQuickActionError(validationError);
        return;
      }
    }
    const parsed = updateProfileSchema.safeParse({
      username: editDraft.username,
      fullName: editDraft.fullName,
      bio: editDraft.bio,
      avatarFile: pendingAvatarFile ? "placeholder" : "",
    });

    if (!parsed.success) {
      setQuickActionError(parsed.error.issues[0]?.message || "Invalid input");
      return;
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
    overflowEmail: activeProfile?.overflowEmail ?? null,
    intraEmail: activeProfile?.intraEmail ?? null,
    googleEmail: activeProfile?.googleEmail ?? null,
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
        subscribedProjects={subscribedProjects}
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

      <ForumProjectsCard
        subscribedProjects={subscribedProjects}
        suggestedProjects={viewingOwnProfile ? suggestedProjects : []}
        isLoading={projectsLoading}
        error={projectsError}
        onRefresh={refetchProjects}
      />

      <GlassInfoCard>
      <div className="flex flex-col md:flex-row gap-5 py-3 mb-2">
        <div className="w-full md:w-1/2">
          <SkillsCard skills={cursusSkills} />
        </div>
        <div className="w-full md:w-1/2">
          <AchievementCard achievements={achievements} />
        </div>
      </div>

      <ProjectsCard projects={projects} />
      </GlassInfoCard>

      <EditUserDialog
        open={editOpen}
        title="Edit user profile"
        draft={editDraft}
        saving={adminLoading}
        error={quickActionError ?? adminError}
        validationMessage={editValidationMessage}
        submitDisabled={!editValidation.success}
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
