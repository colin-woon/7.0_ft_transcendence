"use client";

import { Loader2, Shield, Trash2, UserRound, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fileToDataUrl } from "@/features/auth/utils/avatarFile";
import { useAdminUsers } from "@/features/auth/hooks/useAdminUsers";
import { useUserLookup } from "@/features/auth/hooks/useUserLookup";
import { useUserSearch } from "@/features/auth/hooks/useUserSearch";
import { useAuth } from "@/features/auth/models/AuthContext";
import ConfirmActionDialog from "@/features/auth/ui/settings/components/ConfirmActionDialog";
import EditUserDialog, {
  type EditUserDraft,
} from "@/features/auth/ui/settings/components/EditUserDialog";

interface UsersSearchPageProps {
  initialQuery?: string;
}

type UserConfirmAction =
  | { kind: "logout"; userId: number; username: string }
  | { kind: "delete"; userId: number; username: string };

/**
 * Full results page for navbar-driven user search.
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
  const { query, setQuery, results, loading, error } = useUserSearch({
    minChars: 1,
    pageSize: 20,
    debounceMs: 200,
  });

  const [confirmAction, setConfirmAction] = useState<UserConfirmAction | null>(
    null,
  );
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [editDraft, setEditDraft] = useState<EditUserDraft>({
    username: "",
    fullName: "",
    bio: "",
  });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, setQuery]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

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
    setPendingAvatarFile(null);
    setEditOpen(true);
  };

  /**
   * Persists admin edits for selected user.
   */
  const saveAdminEdit = async () => {
    if (!editUserId) return;
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
    setPendingAvatarFile(null);
    setEditOpen(false);
  };

  /**
   * Applies role or ban-state patch from quick action buttons.
   */
  const applyUserAdminPatch = async (
    userId: number,
    patch: { role?: "STUDENT" | "ADMIN"; isBanned?: boolean },
  ) => {
    await updateUser(userId, patch);
  };

  /**
   * Executes the selected user-level destructive action.
   */
  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      if (confirmAction.kind === "logout") {
        await logoutUser(confirmAction.userId);
      }
      if (confirmAction.kind === "delete") {
        await deleteUser(confirmAction.userId);
      }
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
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
            : `Force logout @${confirmAction.username}`,
        message:
          confirmAction.kind === "delete"
            ? "This permanently deletes the user account."
            : "This revokes all active sessions for the user.",
        confirmLabel:
          confirmAction.kind === "delete" ? "Delete" : "Force logout",
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-3xl border border-base-200 bg-gradient-to-br from-base-100 via-base-100 to-base-200/40 p-6 md:p-8 shadow-sm mb-5">
        <p className="text-xs uppercase tracking-wider text-base-content/50 font-semibold">
          Search Results
        </p>
        <p className="text-2xl md:text-3xl font-bold text-base-content mt-1 break-words">
          {query.trim().length > 0 ? `“${query.trim()}”` : "No query"}
        </p>
        <p className="text-sm text-base-content/60 mt-2">
          Use the navbar search to change your query.
        </p>
      </div>

      {(error || adminError) && (
        <div className="alert alert-error mb-3 text-sm">
          {error ?? adminError}
        </div>
      )}

      {loading ? (
        <div className="inline-flex items-center gap-2 text-sm text-base-content/60">
          <Loader2 size={14} className="animate-spin" />
          Searching users...
        </div>
      ) : query.trim().length === 0 ? (
        <p className="text-sm text-base-content/60">
          Enter a search term in the navbar to find users.
        </p>
      ) : results.length === 0 ? (
        <p className="text-sm text-base-content/60">
          No users found for this query.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map((result) => (
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
                  {result.avatarImage ? (
                    <img
                      src={result.avatarImage}
                      alt={`${result.fullName} avatar`}
                      className="w-10 h-10 rounded-full object-cover bg-base-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-xs font-bold">
                      {result.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
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
                    <>
                      <button
                        type="button"
                        className="btn btn-xs btn-neutral"
                        onClick={() => void openEditDialog(result.id)}
                        disabled={adminLoading}
                      >
                        Edit profile
                      </button>

                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() =>
                          void applyUserAdminPatch(result.id, { role: "ADMIN" })
                        }
                        disabled={adminLoading}
                      >
                        <Shield size={12} />
                        Make admin
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() =>
                          void applyUserAdminPatch(result.id, {
                            role: "STUDENT",
                          })
                        }
                        disabled={adminLoading}
                      >
                        Make student
                      </button>

                      <button
                        type="button"
                        className="btn btn-xs btn-warning"
                        onClick={() =>
                          void applyUserAdminPatch(result.id, {
                            isBanned: true,
                          })
                        }
                        disabled={adminLoading}
                      >
                        Ban
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-warning"
                        onClick={() =>
                          void applyUserAdminPatch(result.id, {
                            isBanned: false,
                          })
                        }
                        disabled={adminLoading}
                      >
                        Unban
                      </button>

                      <button
                        type="button"
                        className="btn btn-xs btn-warning"
                        onClick={() =>
                          setConfirmAction({
                            kind: "logout",
                            userId: result.id,
                            username: result.username,
                          })
                        }
                        disabled={adminLoading}
                      >
                        <UserX size={12} />
                        Force logout
                      </button>

                      <button
                        type="button"
                        className="btn btn-xs btn-error"
                        onClick={() =>
                          setConfirmAction({
                            kind: "delete",
                            userId: result.id,
                            username: result.username,
                          })
                        }
                        disabled={adminLoading}
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditUserDialog
        open={editOpen}
        title="Edit user profile"
        draft={editDraft}
        saving={adminLoading}
        error={adminError}
        onChange={(next) => setEditDraft((prev) => ({ ...prev, ...next }))}
        showAvatarUpload
        avatarFileName={pendingAvatarFile?.name ?? null}
        onAvatarFileChange={setPendingAvatarFile}
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
