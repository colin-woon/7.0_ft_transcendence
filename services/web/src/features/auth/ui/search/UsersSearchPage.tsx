"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserRound,
  UserX,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAdminUsers } from "@/features/auth/hooks/useAdminUsers";
import { useUserLookup } from "@/features/auth/hooks/useUserLookup";
import { useUserSearch } from "@/features/auth/hooks/useUserSearch";
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
import { getUserInitials } from "@/features/auth/utils/userInitials";

interface UsersSearchPageProps {
  initialQuery?: string;
}

type UserConfirmAction =
  | { kind: "logout"; userId: number; username: string }
  | { kind: "delete"; userId: number; username: string }
  | {
      kind: "role";
      userId: number;
      username: string;
      nextRole: "STUDENT" | "ADMIN";
    };

const RESULTS_PAGE_SIZE = 5;

function SearchAvatar({
  fullName,
  avatarImage,
  sizeClass = "w-8 h-8",
}: {
  fullName: string;
  avatarImage?: string | null;
  sizeClass?: string;
}) {
  const initials = fullName ? getUserInitials(fullName) : "??";

  if (avatarImage) {
    return (
      <div
        className={`${sizeClass} relative rounded-full overflow-hidden bg-slate-100`}
      >
        <Image
          src={avatarImage}
          alt={`${fullName} avatar`}
          fill
          sizes="40px"
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold`}
    >
      {initials}
    </div>
  );
}

/**
 * Dedicated user search page with inline query input, quick results dropdown, and full results list.
 */
export default function UsersSearchPage({
  initialQuery = "",
}: UsersSearchPageProps) {
  const router = useRouter();
  const { user, isLoading, hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");

  const {
    updateUser,
    logoutUser,
    deleteUser,
    loading: adminLoading,
    error: adminError,
  } = useAdminUsers();

  const { lookup } = useUserLookup({ cacheTtlMs: 5_000 });

  const {
    query: typedQuery,
    setQuery: setTypedQuery,
    results: dropdownResults,
    loading: dropdownLoading,
    error: dropdownError,
    setPage: setDropdownPage,
    searchNow: searchDropdownNow,
  } = useUserSearch({
    minChars: 1,
    pageSize: 8,
    debounceMs: 300,
  });

  const {
    setQuery: setResultsQuery,
    results,
    loading,
    error,
    page,
    setPage,
    searchNow: searchResultsNow,
  } = useUserSearch({
    minChars: 1,
    pageSize: RESULTS_PAGE_SIZE,
    debounceMs: 300,
  });

  const [confirmAction, setConfirmAction] = useState<UserConfirmAction | null>(
    null,
  );
  const [committedQuery, setCommittedQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [quickActionError, setQuickActionError] = useState<string | null>(null);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [editRole, setEditRole] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [editBanned, setEditBanned] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [editDraft, setEditDraft] = useState<EditUserDraft>({
    username: "",
    fullName: "",
    bio: "",
  });

  useEffect(() => {
    const next = initialQuery.trim();
    setTypedQuery(next);
    setCommittedQuery(next);
    setResultsQuery(next);
    setPage(0);
  }, [initialQuery, setTypedQuery, setResultsQuery, setPage]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Opens shared edit dialog prefilled from user lookup endpoint.
   */
  const openEditDialog = async (userId: number) => {
    const detailed = await lookup(userId, true);
    if (!detailed) return;

    setEditUserId(detailed.id);
    setEditDraft({
      username: detailed.username,
      fullName: detailed.fullName,
      bio: detailed.bio ?? "",
    });
    setEditRole(detailed.role);
    setEditBanned(detailed.isBanned);
    setEditUsername(detailed.username);
    setPendingAvatarFile(null);
    setEditOpen(true);
  };

  /**
   * Persists admin edits for selected user.
   */
  const saveAdminEdit = async () => {
    if (!editUserId) return;

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

    const updated = await updateUser(editUserId, {
      username: editDraft.username.trim() || undefined,
      fullName: editDraft.fullName.trim() || undefined,
      bio: editDraft.bio.trim() || undefined,
      avatarFile,
    });

    if (!updated) return;

    setEditRole(updated.role);
    setEditBanned(updated.isBanned);
    setEditUsername(updated.username);
    setPendingAvatarFile(null);

    await Promise.all([searchDropdownNow(), searchResultsNow()]);
    setEditOpen(false);
  };

  /**
   * Applies role or ban-state patch from the admin edit modal.
   */
  const applyUserAdminPatch = async (patch: {
    role?: "STUDENT" | "ADMIN";
    isBanned?: boolean;
  }) => {
    if (!editUserId) return;
    const updated = await updateUser(editUserId, patch);
    if (!updated) return;

    setEditRole(updated.role);
    setEditBanned(updated.isBanned);
    setEditUsername(updated.username);
    setEditDraft((prev) => ({
      ...prev,
      username: updated.username,
      fullName: updated.fullName,
      bio: updated.bio ?? "",
    }));

    await Promise.all([searchDropdownNow(), searchResultsNow()]);
  };

  /**
   * Executes the selected user-level destructive action.
   */
  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      setQuickActionError(null);
      if (confirmAction.kind === "logout") {
        const ok = await logoutUser(confirmAction.userId);
        if (!ok) {
          setQuickActionError(
            `Failed to force logout @${confirmAction.username}`,
          );
        }
      }
      if (confirmAction.kind === "delete") {
        const ok = await deleteUser(confirmAction.userId);
        if (!ok) {
          setQuickActionError(`Failed to delete @${confirmAction.username}`);
        } else {
          if (editUserId === confirmAction.userId) {
            setEditOpen(false);
          }
          await Promise.all([searchDropdownNow(), searchResultsNow()]);
        }
      }
      if (confirmAction.kind === "role") {
        const updated = await updateUser(confirmAction.userId, {
          role: confirmAction.nextRole,
        });
        if (!updated) {
          setQuickActionError(
            `Failed to change role for @${confirmAction.username}`,
          );
        } else {
          setEditRole(updated.role);
          setEditUsername(updated.username);
          setEditDraft((prev) => ({
            ...prev,
            username: updated.username,
            fullName: updated.fullName,
            bio: updated.bio ?? "",
          }));
          await Promise.all([searchDropdownNow(), searchResultsNow()]);
        }
      }
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const handleCommitSearch = () => {
    const next = typedQuery.trim();
    if (next.length === 0) {
      setShowDropdown(false);
      setCommittedQuery("");
      setPage(0);
      setResultsQuery("");
      router.replace("/search");
      return;
    }

    setShowDropdown(false);
    setCommittedQuery(next);
    setPage(0);
    setResultsQuery(next);
    router.replace(`/search?q=${encodeURIComponent(next)}`);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-flex items-center gap-2 text-sm text-base-content/70">
          <Loader2 size={16} className="animate-spin" />
          Redirecting to login...
        </div>
      </div>
    );
  }

  const confirmConfig = confirmAction
    ? {
        title:
          confirmAction.kind === "delete"
            ? `Delete @${confirmAction.username}`
            : confirmAction.kind === "logout"
              ? `Force logout @${confirmAction.username}`
              : `${confirmAction.nextRole === "ADMIN" ? "Make" : "Demote"} @${confirmAction.username}`,
        message:
          confirmAction.kind === "delete"
            ? "This permanently deletes the user account."
            : confirmAction.kind === "logout"
              ? "This revokes all active sessions for the user."
              : confirmAction.nextRole === "ADMIN"
                ? "This grants administrator privileges to this user."
                : "This removes administrator privileges from this user.",
        confirmLabel:
          confirmAction.kind === "delete"
            ? "Delete"
            : confirmAction.kind === "logout"
              ? "Force logout"
              : confirmAction.nextRole === "ADMIN"
                ? "Make admin"
                : "Make student",
        tone: (confirmAction.kind === "delete" ? "danger" : "warning") as
          | "warning"
          | "danger",
      }
    : {
        title: "Confirm action",
        message: "Please confirm this action.",
        confirmLabel: "Confirm",
        tone: "warning" as "warning" | "danger",
      };

  const trimmedQuery = typedQuery.trim();
  const hasCommittedQuery = committedQuery.trim().length > 0;
  const filteredDropdownResults = dropdownResults.filter(
    (result) => result.id !== user.id,
  );
  const filteredResults = results.filter((result) => result.id !== user.id);
  const canGoPrev = page > 0 && !loading;
  const canGoNext = !loading && results.length === RESULTS_PAGE_SIZE;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="relative mb-5" ref={dropdownRef}>
        <div className="relative flex items-center justify-center">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users"
            value={typedQuery}
            onChange={(event) => {
              setTypedQuery(event.target.value);
              setDropdownPage(0);
              setShowDropdown(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCommitSearch();
              }
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full h-11 px-11 text-center bg-white hover:bg-slate-100 focus:bg-slate-100 border-2 border-[#0f6f6b] focus:border-[#0f6f6b] focus:ring-2 focus:ring-[#0f6f6b]/20 rounded-full text-sm text-slate-900 placeholder-slate-500 outline-none transition-all duration-200 shadow-md shadow-[#0f6f6b]/20"
          />
        </div>

        {showDropdown && trimmedQuery.length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-80 overflow-y-auto">
            {quickActionError && (
              <div className="mx-3 mt-3 alert alert-error py-2 text-xs">
                {quickActionError}
              </div>
            )}
            {dropdownError ? (
              <div className="p-4 text-sm text-error">{dropdownError}</div>
            ) : dropdownLoading ? (
              <div className="p-4 text-sm text-slate-500">Searching...</div>
            ) : filteredDropdownResults.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">No users found.</div>
            ) : (
              filteredDropdownResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
                >
                  <button
                    type="button"
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                    onClick={() => {
                      setShowDropdown(false);
                      setTypedQuery("");
                      router.push(`/users/${result.id}`);
                    }}
                  >
                    <SearchAvatar
                      fullName={result.fullName}
                      avatarImage={result.avatarImage}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {result.fullName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        @{result.username}
                      </p>
                    </div>
                  </button>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          setConfirmAction({
                            kind: "logout",
                            userId: result.id,
                            username: result.username,
                          });
                        }}
                        disabled={adminLoading}
                        aria-label={`Force logout ${result.username}`}
                      >
                        <UserX size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {!dropdownLoading && filteredDropdownResults.length > 0 && (
              <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Press Enter for full results
                </span>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={handleCommitSearch}
                >
                  <UserRound size={12} />
                  Open page
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {(quickActionError || error || adminError) && (
        <div className="alert alert-error mb-3 text-sm">
          {quickActionError ?? error ?? adminError}
        </div>
      )}

      {loading ? (
        <div className="inline-flex items-center gap-2 text-sm text-base-content/60">
          <Loader2 size={14} className="animate-spin" />
          Searching users...
        </div>
      ) : !hasCommittedQuery ? (
        <p className="text-sm text-base-content/60">
          Type in the search bar and press Enter to show results.
        </p>
      ) : filteredResults.length === 0 ? (
        <p className="text-sm text-base-content/60">
          No users found for this query.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              className="card bg-base-100 border border-base-200 hover:border-base-300 transition"
            >
              <div className="card-body p-4 gap-3">
                <button
                  type="button"
                  className="flex items-center gap-3 min-w-0 text-left"
                  onClick={() => router.push(`/users/${result.id}`)}
                >
                  <SearchAvatar
                    fullName={result.fullName}
                    avatarImage={result.avatarImage}
                    sizeClass="w-10 h-10"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{result.fullName}</p>
                    <p className="text-xs text-base-content/60 truncate">
                      @{result.username}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2 justify-end flex-wrap">
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => router.push(`/users/${result.id}`)}
                  >
                    <UserRound size={12} />
                    Open profile
                  </button>

                  {isAdmin && (
                    <UserAdminActionButtons
                      compact
                      disabled={adminLoading}
                      onEdit={() => void openEditDialog(result.id)}
                      onForceLogout={() =>
                        setConfirmAction({
                          kind: "logout",
                          userId: result.id,
                          username: result.username,
                        })
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasCommittedQuery && !loading ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={!canGoPrev}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-base-content/70 min-w-[4.5rem] text-center">
            Page {page + 1}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!canGoNext}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}

      <EditUserDialog
        open={editOpen}
        title="Edit user profile"
        draft={editDraft}
        saving={adminLoading}
        error={quickActionError ?? adminError}
        onChange={(next) => setEditDraft((prev) => ({ ...prev, ...next }))}
        showAvatarUpload
        avatarFileName={pendingAvatarFile?.name ?? null}
        onAvatarFileChange={setPendingAvatarFile}
        extraActions={
          isAdmin && editUserId ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => {
                  if (!editUserId) return;
                  setConfirmAction({
                    kind: "role",
                    userId: editUserId,
                    username: editUsername || editDraft.username,
                    nextRole: editRole === "ADMIN" ? "STUDENT" : "ADMIN",
                  });
                }}
                disabled={adminLoading}
              >
                <Shield size={12} />
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
                onClick={() =>
                  setConfirmAction({
                    kind: "delete",
                    userId: editUserId,
                    username: editUsername || editDraft.username,
                  })
                }
                disabled={adminLoading}
              >
                <Trash2 size={12} />
                Delete user
              </button>
            </div>
          ) : null
        }
        onClose={() => setEditOpen(false)}
        onSubmit={saveAdminEdit}
      />

      <ConfirmActionDialog
        open={Boolean(confirmAction)}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.confirmLabel}
        tone={confirmConfig.tone}
        loading={confirmLoading || adminLoading}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
      />
    </div>
  );
}
