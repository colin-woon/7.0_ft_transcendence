"use client";

import {
  AlertCircle,
  Calendar,
  Link as LinkIcon,
  Loader2,
  LogOut,
  RefreshCcw,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CreateUserPayload,
  SessionInfo,
  User,
} from "@/features/auth/api/authService";
import { useAdminUsers } from "@/features/auth/hooks/useAdminUsers";
import { useAuthActions } from "@/features/auth/hooks/useAuthActions";
import { useProfileEdit } from "@/features/auth/hooks/useProfileEdit";
import { useSessions } from "@/features/auth/hooks/useSessions";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { useAuth } from "@/features/auth/models/AuthContext";
import ConfirmActionDialog from "@/features/auth/ui/settings/components/ConfirmActionDialog";
import EditUserDialog, {
  type EditUserDraft,
} from "@/features/auth/ui/settings/components/EditUserDialog";
import {
  fileToDataUrl,
  validateAvatarFile,
} from "@/features/auth/utils/avatarFile";
import {
  type PasswordChangeFormValues,
  passwordChangeSchema,
} from "@/features/auth/validation/authSchemas";

interface SettingsPageProps {
  initialProfile?: User | null;
  initialProfileError?: string | null;
  initialProfileErrorStatus?: number | null;
  initialSessions?: SessionInfo[];
}

type SettingsTab = {
  key: "profile" | "security" | "sessions" | "admin";
  label: string;
  href: string;
  adminOnly?: boolean;
};

type ConfirmAction =
  | { kind: "delete-account" }
  | { kind: "logout" }
  | { kind: "logout-all" }
  | { kind: "end-session"; sessionId: string };

const SETTINGS_TABS: readonly SettingsTab[] = [
  { key: "profile", label: "Profile", href: "/settings/profile" },
  { key: "security", label: "Security", href: "/settings/security" },
  { key: "sessions", label: "Sessions", href: "/settings/sessions" },
  { key: "admin", label: "Admin", href: "/settings/admin", adminOnly: true },
];

/**
 * Returns copy and tone for confirmation modal from selected action.
 */
function getConfirmConfig(action: ConfirmAction | null): {
  title: string;
  message: string;
  confirmLabel: string;
  tone: "warning" | "danger";
} {
  if (!action) {
    return {
      title: "Confirm action",
      message: "Please confirm this action.",
      confirmLabel: "Confirm",
      tone: "warning",
    };
  }

  switch (action.kind) {
    case "delete-account":
      return {
        title: "Delete account",
        message: "This permanently removes your account and cannot be undone.",
        confirmLabel: "Delete",
        tone: "danger",
      };
    case "logout":
      return {
        title: "Logout",
        message: "You will be signed out from your current session.",
        confirmLabel: "Logout",
        tone: "warning",
      };
    case "logout-all":
      return {
        title: "Logout all sessions",
        message:
          "This signs you out from every device, including your current one.",
        confirmLabel: "Logout all",
        tone: "warning",
      };
    case "end-session":
      return {
        title: "End session",
        message: "This session will be revoked immediately.",
        confirmLabel: "End session",
        tone: "warning",
      };
    default:
      return {
        title: "Confirm action",
        message: "Please confirm this action.",
        confirmLabel: "Confirm",
        tone: "warning",
      };
  }
}

export default function SettingsPage({
  initialProfile,
  initialProfileError,
  initialProfileErrorStatus,
  initialSessions,
}: SettingsPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    user,
    isLoading: authLoading,
    hasRole,
    reloadIntraData,
    updatePassword,
    clearError,
    error: authError,
  } = useAuth();

  const {
    loginWith,
    logoutNow,
    refreshNow,
    actionLoading,
    actionError,
    clearActionError,
  } = useAuthActions();

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    clearError: clearProfileError,
    refetch,
  } = useUserProfile(undefined, {
    skip: !user,
    initialProfile,
    initialError: initialProfileError,
    initialErrorStatus: initialProfileErrorStatus,
  });

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    clearError: clearSessionsError,
    endingSessionId,
    endingAll,
    refresh: refreshSessions,
    endSession,
    endAllSessions,
  } = useSessions({ initialSessions });

  const {
    saveProfile,
    deleteProfile,
    saving: profileSaving,
    deleting: profileDeleting,
    error: profileEditError,
    clearError: clearProfileEditError,
  } = useProfileEdit();

  const {
    createUser: adminCreateUser,
    loading: adminLoading,
    error: adminHookError,
    clearError: clearAdminHookError,
  } = useAdminUsers();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(
    null,
  );

  const [editDraft, setEditDraft] = useState<EditUserDraft>({
    username: "",
    fullName: "",
    bio: "",
  });

  const [passwordForm, setPasswordForm] = useState<PasswordChangeFormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<Record<keyof PasswordChangeFormValues, string>>
  >({});
  const [passwordFormError, setPasswordFormError] = useState<string | null>(
    null,
  );
  const [passwordFormSuccess, setPasswordFormSuccess] = useState<string | null>(
    null,
  );
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [reloadingIntra, setReloadingIntra] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const [newUserForm, setNewUserForm] = useState<CreateUserPayload>({
    username: "",
    fullName: "",
    email: "",
    bio: "",
    role: "STUDENT",
    isBanned: false,
  });

  const isAdmin = hasRole("ADMIN");
  const activeProfile = profile ?? user;
  const requestedTab = pathname?.split("/")[2] ?? "profile";
  const activeTab = useMemo(() => {
    const candidate = requestedTab as SettingsTab["key"];
    const isKnown = SETTINGS_TABS.some((tab) => tab.key === candidate);
    return isKnown ? candidate : "profile";
  }, [requestedTab]);
  const lastTabRef = useRef<string | null>(null);

  const visibleTabs = useMemo(
    () => SETTINGS_TABS.filter((tab) => !tab.adminOnly || isAdmin),
    [isAdmin],
  );

  useEffect(() => {
    if (!activeProfile) return;
    setEditDraft({
      username: activeProfile.username,
      fullName: activeProfile.fullName,
      bio: activeProfile.bio ?? "",
    });
  }, [activeProfile]);

  useEffect(() => {
    if (authLoading || !user) return;

    if (requestedTab !== activeTab) {
      router.replace(`/settings/${activeTab}`);
      return;
    }

    if (activeTab === "admin" && !isAdmin) {
      router.replace("/settings/profile");
    }
  }, [activeTab, authLoading, isAdmin, requestedTab, router, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) {
      lastTabRef.current = activeTab;
      return;
    }

    if (activeTab === "sessions" && lastTabRef.current !== "sessions") {
      void refreshSessions();
    }

    lastTabRef.current = activeTab;
  }, [activeTab, refreshSessions, user]);

  const pageError =
    authError ??
    profileError ??
    profileEditError ??
    (activeTab === "sessions" ? sessionsError : null) ??
    adminActionError ??
    actionError ??
    (activeTab === "admin" ? adminHookError : null);

  const updateNewUserForm = <K extends keyof CreateUserPayload>(
    key: K,
    value: CreateUserPayload[K],
  ) => {
    setNewUserForm((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Persists profile edits for the currently authenticated user.
   */
  const handleSaveOwnProfile = async () => {
    if (pendingAvatarFile) {
      const validationError = validateAvatarFile(pendingAvatarFile);
      if (validationError) {
        setAdminActionError(validationError);
        return;
      }
    }

    let avatarFilePayload: string | undefined;
    if (pendingAvatarFile) {
      avatarFilePayload = await fileToDataUrl(pendingAvatarFile);
    }

    const updated = await saveProfile({
      username: editDraft.username.trim() || undefined,
      fullName: editDraft.fullName.trim() || undefined,
      bio: editDraft.bio.trim() || undefined,
      avatarFile: avatarFilePayload,
    });

    if (!updated) return;

    setPendingAvatarFile(null);
    setEditModalOpen(false);
    await refetch();
    setAdminActionSuccess("Profile updated successfully.");
  };

  /**
   * Applies password update flow with schema-level validation.
   */
  const handlePasswordUpdate = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordFormError(null);
    setPasswordFormSuccess(null);

    const parsed = passwordChangeSchema.safeParse(passwordForm);
    if (!parsed.success) {
      const nextErrors: Partial<
        Record<keyof PasswordChangeFormValues, string>
      > = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as
          | keyof PasswordChangeFormValues
          | undefined;
        if (field && !nextErrors[field]) {
          nextErrors[field] = issue.message;
        }
      }
      setPasswordErrors(nextErrors);
      return;
    }

    const hasExistingPassword = Boolean(activeProfile?.hasPassword);
    const currentPassword = parsed.data.currentPassword;
    if (
      hasExistingPassword &&
      (!currentPassword || currentPassword.length === 0)
    ) {
      setPasswordErrors({
        currentPassword: "Current password is required to change your password",
      });
      return;
    }

    setPasswordErrors({});
    setPasswordSaving(true);
    try {
      await updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordFormSuccess(
        hasExistingPassword
          ? "Password changed successfully."
          : "Password created successfully.",
      );
      await refetch();
    } catch (err) {
      setPasswordFormError(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  /**
   * Triggers a server-side refresh for linked 42 profile data.
   */
  const handleReload42 = async () => {
    setReloadingIntra(true);
    try {
      const updated = await reloadIntraData();
      if (updated) {
        await refetch();
      }
    } finally {
      setReloadingIntra(false);
    }
  };

  /**
   * Creates a user as admin using the fuller UserInfoDTO-aligned fields.
   */
  const handleAdminCreateUser = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAdminActionError(null);
    setAdminActionSuccess(null);

    const username = newUserForm.username.trim();
    const fullName = newUserForm.fullName.trim();
    const email = newUserForm.email.trim();

    if (!username || !fullName || !email) {
      setAdminActionError("Username, full name, and email are required.");
      return;
    }

    const created = await adminCreateUser({
      username,
      fullName,
      email,
      bio: newUserForm.bio?.trim() || undefined,
      role: newUserForm.role,
      isBanned: newUserForm.isBanned,
    });

    if (!created) {
      setAdminActionError("Failed to create user");
      return;
    }

    setNewUserForm({
      username: "",
      fullName: "",
      email: "",
      bio: "",
      role: "STUDENT",
      isBanned: false,
    });
    setAdminActionSuccess(`Created user @${created.username} (${created.id}).`);
  };

  /**
   * Executes the currently-selected destructive/security action.
   */
  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction.kind === "delete-account") {
        const deleted = await deleteProfile();
        if (deleted) {
          router.push("/login");
        }
      }

      if (confirmAction.kind === "logout") {
        await logoutNow();
      }

      if (confirmAction.kind === "logout-all") {
        await endAllSessions();
      }

      if (confirmAction.kind === "end-session") {
        await endSession(confirmAction.sessionId);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const clearAllErrors = () => {
    clearError();
    clearProfileError();
    clearProfileEditError();
    clearSessionsError();
    clearActionError();
    clearAdminHookError();
    setAdminActionError(null);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-base-content/70">
          <Loader2 size={16} className="animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  if (!user || !activeProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-base-content/70">
          <Loader2 size={16} className="animate-spin" />
          Redirecting to login...
        </div>
      </div>
    );
  }

  const confirmConfig = getConfirmConfig(confirmAction);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-base-content">Settings</h1>
        <p className="text-sm text-base-content/60 mt-1">
          Manage profile, account security, sessions, and admin controls.
        </p>
      </div>

      {pageError && (
        <div className="alert alert-error mb-4">
          <AlertCircle size={16} />
          <span className="text-sm">{pageError}</span>
          <button
            type="button"
            className="btn btn-xs btn-ghost ml-auto"
            onClick={clearAllErrors}
          >
            Dismiss
          </button>
        </div>
      )}

      {adminActionSuccess && (
        <div className="alert alert-success mb-4 text-sm">
          {adminActionSuccess}
        </div>
      )}

      <div
        role="tablist"
        className="tabs tabs-bordered w-full overflow-x-auto flex-nowrap"
      >
        {visibleTabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (pathname === "/settings" && tab.key === "profile");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              className={`tab whitespace-nowrap ${isActive ? "tab-active" : ""}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm mt-0 rounded-t-none">
        <div className="card-body">
          {activeTab === "profile" && (
            <>
              <h2 className="text-base font-bold text-base-content">
                Public Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <div className="rounded-xl border border-base-200 p-3">
                  <div className="text-xs text-base-content/60 mb-1">
                    Username
                  </div>
                  <div className="font-medium">@{activeProfile.username}</div>
                </div>
                <div className="rounded-xl border border-base-200 p-3">
                  <div className="text-xs text-base-content/60 mb-1">
                    Full Name
                  </div>
                  <div className="font-medium">{activeProfile.fullName}</div>
                </div>
                <div className="rounded-xl border border-base-200 p-3 md:col-span-2">
                  <div className="text-xs text-base-content/60 mb-1">Email</div>
                  <div className="font-medium">{activeProfile.email}</div>
                </div>
                <div className="rounded-xl border border-base-200 p-3 md:col-span-2">
                  <div className="text-xs text-base-content/60 mb-1">Bio</div>
                  <div className="text-sm">
                    {activeProfile.bio || "No bio yet"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-neutral"
                  onClick={() => setEditModalOpen(true)}
                >
                  Edit profile
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={handleReload42}
                    disabled={reloadingIntra}
                  >
                    <RefreshCcw
                      size={14}
                      className={reloadingIntra ? "animate-spin" : ""}
                    />
                    {reloadingIntra ? "Reloading..." : "Reload 42 data"}
                  </button>
                )}
              </div>

              <h2 className="text-base font-bold text-base-content mt-8">
                Account Connections
              </h2>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-base-200">
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon size={14} className="text-base-content/50" />
                    Google
                  </div>
                  <button
                    type="button"
                    className={`btn btn-xs rounded-full ${activeProfile.linkedWithGoogle ? "btn-outline" : "btn-neutral"}`}
                    onClick={() =>
                      !activeProfile.linkedWithGoogle && loginWith("google")
                    }
                    disabled={activeProfile.linkedWithGoogle}
                  >
                    {activeProfile.linkedWithGoogle ? "Linked" : "Link"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-base-200">
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon size={14} className="text-base-content/50" />
                    42 Intra
                  </div>
                  <button
                    type="button"
                    className={`btn btn-xs rounded-full ${activeProfile.linkedWithIntra ? "btn-outline" : "btn-neutral"}`}
                    onClick={() =>
                      !activeProfile.linkedWithIntra && loginWith("42")
                    }
                    disabled={activeProfile.linkedWithIntra}
                  >
                    {activeProfile.linkedWithIntra ? "Linked" : "Link"}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "security" && (
            <>
              <h2 className="text-base font-bold text-base-content">
                Password
              </h2>
              <form className="space-y-3 mt-2" onSubmit={handlePasswordUpdate}>
                {activeProfile.hasPassword && (
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Current password"
                    className="input input-bordered w-full"
                    value={passwordForm.currentPassword ?? ""}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: event.target.value,
                      }))
                    }
                  />
                )}
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-error">
                    {passwordErrors.currentPassword}
                  </p>
                )}

                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    activeProfile.hasPassword
                      ? "New password"
                      : "Create password"
                  }
                  className="input input-bordered w-full"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: event.target.value,
                    }))
                  }
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-error">
                    {passwordErrors.newPassword}
                  </p>
                )}

                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  className="input input-bordered w-full"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-error">
                    {passwordErrors.confirmPassword}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-sm btn-neutral"
                  disabled={passwordSaving}
                >
                  {passwordSaving
                    ? "Saving..."
                    : activeProfile.hasPassword
                      ? "Change password"
                      : "Create password"}
                </button>
              </form>

              {passwordFormError && (
                <p className="text-xs text-error mt-2">{passwordFormError}</p>
              )}
              {passwordFormSuccess && (
                <p className="text-xs text-success mt-2">
                  {passwordFormSuccess}
                </p>
              )}

              <h2 className="text-base font-bold text-base-content mt-8">
                Delete Account
              </h2>
              <p className="text-sm text-base-content/60 mt-1">
                This action is irreversible and removes your account data.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-error mt-3"
                onClick={() => setConfirmAction({ kind: "delete-account" })}
              >
                <Trash2 size={14} />
                Delete account
              </button>
            </>
          )}

          {activeTab === "sessions" && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-base-content">
                  Active Sessions
                </h2>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={refreshSessions}
                >
                  <RefreshCcw
                    size={13}
                    className={sessionsLoading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              <div className="space-y-2 mt-3">
                {sessionsLoading ? (
                  <div className="inline-flex items-center gap-2 text-sm text-base-content/60">
                    <Loader2 size={14} className="animate-spin" />
                    Loading sessions...
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-base-content/60">
                    No active sessions found.
                  </p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className="rounded-xl border border-base-200 p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {session.browser || "Unknown browser"} ·{" "}
                          {session.os || "Unknown OS"}
                        </p>
                        <p className="text-xs text-base-content/60 mt-1">
                          IP: {session.ipAddress || "N/A"}
                        </p>
                        <p className="text-xs text-base-content/50 mt-1 inline-flex items-center gap-1">
                          <Calendar size={11} />
                          Expires {new Date(session.expiresAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {session.isCurrent ? (
                          <span className="badge badge-outline badge-success">
                            Current
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => {
                            if (session.isCurrent) {
                              setConfirmAction({ kind: "logout" });
                              return;
                            }
                            setConfirmAction({
                              kind: "end-session",
                              sessionId: session.sessionId,
                            });
                          }}
                          disabled={
                            endingSessionId === session.sessionId ||
                            (session.isCurrent && actionLoading === "logout")
                          }
                        >
                          <LogOut size={12} />
                          {session.isCurrent ? "Logout" : "End"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-base-200 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setConfirmAction({ kind: "logout" })}
                  disabled={actionLoading === "logout" || endingAll}
                >
                  <LogOut size={14} />
                  {actionLoading === "logout" ? "Logging out..." : "Logout"}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-error"
                  onClick={() => setConfirmAction({ kind: "logout-all" })}
                  disabled={endingAll || actionLoading === "logout"}
                >
                  <Users size={14} />
                  {endingAll ? "Signing out all..." : "Logout all sessions"}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={refreshNow}
                    disabled={
                      actionLoading === "refresh" || actionLoading === "logout"
                    }
                  >
                    <RefreshCcw
                      size={14}
                      className={
                        actionLoading === "refresh" ? "animate-spin" : ""
                      }
                    />
                    {actionLoading === "refresh"
                      ? "Refreshing..."
                      : "Auth refresh"}
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === "admin" && isAdmin && (
            <div className="rounded-2xl border border-base-200 bg-base-100 p-4 md:p-5">
              <div className="mb-4">
                <h2 className="text-base font-bold text-base-content">
                  Create User
                </h2>
                <p className="text-sm text-base-content/60 mt-1">
                  Create a local account with role, profile details, and initial
                  status.
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleAdminCreateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="form-control">
                    <span className="label-text text-xs text-base-content/60 mb-1">
                      Username
                    </span>
                    <input
                      className="input input-bordered"
                      placeholder="jdoe"
                      value={newUserForm.username}
                      onChange={(event) =>
                        updateNewUserForm("username", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text text-xs text-base-content/60 mb-1">
                      Full name
                    </span>
                    <input
                      className="input input-bordered"
                      placeholder="Jane Doe"
                      value={newUserForm.fullName}
                      onChange={(event) =>
                        updateNewUserForm("fullName", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="form-control md:col-span-2">
                    <span className="label-text text-xs text-base-content/60 mb-1">
                      Email
                    </span>
                    <input
                      className="input input-bordered"
                      placeholder="jane@example.com"
                      type="email"
                      value={newUserForm.email}
                      onChange={(event) =>
                        updateNewUserForm("email", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="form-control md:col-span-2">
                    <span className="label-text text-xs text-base-content/60 mb-1">
                      Bio (optional)
                    </span>
                    <textarea
                      className="textarea textarea-bordered min-h-24"
                      placeholder="Short profile bio"
                      value={newUserForm.bio ?? ""}
                      onChange={(event) =>
                        updateNewUserForm("bio", event.target.value)
                      }
                    />
                  </label>

                  <label className="form-control">
                    <span className="label-text text-xs text-base-content/60 mb-1">
                      Role
                    </span>
                    <select
                      className="select select-bordered"
                      value={newUserForm.role}
                      onChange={(event) =>
                        updateNewUserForm(
                          "role",
                          event.target.value as "STUDENT" | "ADMIN",
                        )
                      }
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </label>

                  <label className="form-control">
                    <span className="label-text text-xs text-base-content/60 mb-1">
                      Initial status
                    </span>
                    <select
                      className="select select-bordered"
                      value={newUserForm.isBanned ? "banned" : "active"}
                      onChange={(event) =>
                        updateNewUserForm(
                          "isBanned",
                          event.target.value === "banned",
                        )
                      }
                    >
                      <option value="active">Active</option>
                      <option value="banned">Banned</option>
                    </select>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={adminLoading}
                  >
                    {adminLoading ? "Creating..." : "Create user"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <EditUserDialog
        open={editModalOpen}
        title="Edit Profile"
        draft={editDraft}
        showAvatarUpload={true}
        saving={profileSaving}
        error={profileEditError}
        avatarFileName={pendingAvatarFile?.name ?? null}
        onChange={(next) => setEditDraft((prev) => ({ ...prev, ...next }))}
        onAvatarFileChange={setPendingAvatarFile}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleSaveOwnProfile}
      />

      <ConfirmActionDialog
        open={Boolean(confirmAction)}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        tone={confirmConfig.tone}
        loading={confirmLoading || profileDeleting}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
}
