"use client";

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Menu, Search, Trash2, UserRound, UserX } from 'lucide-react'
import { useAppShell } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'
import { useAdminUsers } from '@/features/auth/hooks/useAdminUsers'
import { useUserSearch } from '@/features/auth/hooks/useUserSearch'
import { useAuth } from '@/features/auth/models/AuthContext'
import ConfirmActionDialog from '@/features/auth/ui/settings/components/ConfirmActionDialog'
import UserMenu from './UserMenu'

type HeaderConfirmAction =
  | { kind: 'logout'; userId: number; username: string }
  | { kind: 'delete'; userId: number; username: string }

function SearchAvatar({
  fullName,
  avatarImage,
}: {
  fullName: string
  avatarImage?: string | null
}) {
  const initials = fullName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (avatarImage) {
    return (
      <img
        src={avatarImage}
        alt={`${fullName} avatar`}
        className="w-8 h-8 rounded-full object-cover bg-slate-100"
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
      {initials}
    </div>
  )
}

export default function Header() {
  const { toggleSidebar } = useAppShell();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] =
    useState<HeaderConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { logoutUser, deleteUser, loading: adminLoading } = useAdminUsers();

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

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      setAdminActionError(null);
      if (confirmAction.kind === "logout") {
        const ok = await logoutUser(confirmAction.userId);
        if (!ok) {
          setAdminActionError(
            `Failed to force logout @${confirmAction.username}`,
          );
        }
      }

      if (confirmAction.kind === "delete") {
        const ok = await deleteUser(confirmAction.userId);
        if (!ok) {
          setAdminActionError(`Failed to delete @${confirmAction.username}`);
        }
      }
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  // Search users with debounced query
  const { results, loading, setQuery, query } = useUserSearch({
    minChars: 1,
    pageSize: 8,
    debounceMs: 300,
  });

  // Hide dropdown on outside click
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

  return (
    <header className="h-16 bg-white text-slate-900 z-[60] border-b border-gray-200 w-full shadow-sm px-4 pr-2">
      <div className="max-w-7xl mx-auto h-full flex items-center py-3">
        <div className="flex items-center justify-between w-full">
          {/* Left: Sidebar + Brand */}
          <div className="flex items-center gap-2 min-w-0 w-auto lg:w-64 justify-start shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center shrink-0 rounded-full p-2 text-slate-700 hover:bg-black/5 transition"
              aria-label="Toggle sidebar"
            >
              <Menu
                size={20}
                className="block h-5 w-5 text-slate-700"
                strokeWidth={2.25}
              />
            </button>
            <Link href="/projects" className="pl-3 text-base-content text-xl font-bold inline hover:text-secondary transition-colors">
                  <Image
                    src="/assets/42overflow.png" 
                    alt="42 Overflow Logo"
                    width={204}
                     height={40}
                    className="object-contain"
                    priority
                  />
            </Link>
          </div>

          {/* Center: Search bar */}
          <div className="flex-1 flex justify-center px-2 sm:px-4 lg:px-8 shrink">
            <div className="relative w-full max-w-4xl" ref={dropdownRef}>
              <div className="relative flex items-center justify-center">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search users"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const q = query.trim();
                      if (q.length === 0) return;
                      setShowDropdown(false);
                      router.push(`/users?q=${encodeURIComponent(q)}`);
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full h-10 px-11 text-center bg-white-100 hover:bg-slate-100 focus:bg-slate-100 border-2 border-[#0f6f6b] focus:border-[#0f6f6b] focus:ring-2 focus:ring-[#0f6f6b]/20 rounded-full text-sm text-slate-900 placeholder-slate-500 outline-none transition-all duration-200 shadow-md shadow-[#0f6f6b]/30"
                />
              </div>
              {showDropdown && query.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                  {adminActionError && (
                    <div className="mx-3 mt-3 alert alert-error py-2 text-xs">
                      {adminActionError}
                    </div>
                  )}
                  {loading ? (
                    <div className="p-4 text-sm text-slate-500">
                      Searching...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">
                      No users found.
                    </div>
                  ) : (
                    results.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50"
                      >
                        <button
                          type="button"
                          className="flex-1 min-w-0 flex items-center gap-3 text-left"
                          onClick={() => {
                            setShowDropdown(false);
                            setQuery("");
                            router.push(`/users/${user.id}`);
                          }}
                        >
                          <SearchAvatar
                            fullName={user.fullName}
                            avatarImage={user.avatarImage}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {user.fullName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              @{user.username}
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
                                  userId: user.id,
                                  username: user.username,
                                });
                              }}
                              disabled={adminLoading}
                              aria-label={`Force logout ${user.username}`}
                            >
                              <UserX size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-error"
                              onClick={(event) => {
                                event.stopPropagation();
                                setConfirmAction({
                                  kind: "delete",
                                  userId: user.id,
                                  username: user.username,
                                });
                              }}
                              disabled={adminLoading}
                              aria-label={`Delete ${user.username}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {!loading && results.length > 0 && (
                    <div className="px-3 py-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Press Enter for full results
                      </span>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost"
                        onClick={() => {
                          const q = query.trim();
                          if (!q) return;
                          setShowDropdown(false);
                          router.push(`/users?q=${encodeURIComponent(q)}`);
                        }}
                      >
                        <UserRound size={12} />
                        Open page
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: User menu */}
          <div className="flex items-center gap-1 w-auto lg:w-64 justify-end shrink-0">
            <UserMenu />
          </div>
        </div>
      </div>

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
    </header>
  );
}
