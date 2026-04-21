"use client";

import type { ReactNode } from "react";

export interface EditUserDraft {
  username: string;
  fullName: string;
  bio: string;
}

export interface EditUserDialogProps {
  open: boolean;
  title: string;
  draft: EditUserDraft;
  showAvatarUpload?: boolean;
  saving?: boolean;
  error?: string | null;
  avatarFileName?: string | null;
  extraActions?: ReactNode;
  onChange: (next: Partial<EditUserDraft>) => void;
  onAvatarFileChange?: (file: File | null) => void;
  onClose: () => void;
  onSubmit: () => Promise<void> | void;
}

/**
 * Shared profile edit modal used by settings profile and admin search editing.
 */
export default function EditUserDialog({
  open,
  title,
  draft,
  showAvatarUpload = false,
  saving = false,
  error,
  avatarFileName,
  extraActions,
  onChange,
  onAvatarFileChange,
  onClose,
  onSubmit,
}: EditUserDialogProps) {
  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box bg-base-100 border border-base-200 p-0 flex flex-col rounded-2xl max-w-lg">

        {/* Header */}
        <div className="px-5 py-4 border-b border-base-200 shrink-0">
          <h3 className="font-bold text-base text-base-content">{title}</h3>
        </div>

        {/* Body */}
        <form
          className="flex flex-col flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <div className="px-5 py-4 space-y-4 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">

              <label className="flex flex-col gap-1.5 w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">Username</span>
                <input
                  className="input h-10 w-full rounded-md text-sm bg-base-100 shadow-sm border border-base-200 focus:outline-none focus:border-base-300 focus:ring-2 focus:ring-base-300/50 transition-all"
                  placeholder="Username"
                  value={draft.username}
                  onChange={(event) => onChange({ username: event.target.value })}
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">Full name</span>
                <input
                  className="input h-10 w-full rounded-md text-sm bg-base-100 shadow-sm border border-base-200 focus:outline-none focus:border-base-300 focus:ring-2 focus:ring-base-300/50 transition-all"
                  placeholder="Full name"
                  value={draft.fullName}
                  onChange={(event) => onChange({ fullName: event.target.value })}
                  required
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2 mt-[-8px]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                  Bio <span className="normal-case font-normal tracking-normal text-base-content/40">(optional)</span>
                </span>
                <textarea
                  className="textarea rounded-md text-sm bg-base-100 min-h-20 resize-none leading-relaxed shadow-sm py-2 w-full border border-base-200 focus:outline-none focus:border-base-300 focus:ring-2 focus:ring-base-300/50 transition-all"
                  placeholder="Short profile bio..."
                  value={draft.bio ?? ""}
                  onChange={(event) => onChange({ bio: event.target.value })}
                />
              </label>

              {showAvatarUpload && (
                <label className="flex flex-col gap-1.5 md:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">Avatar</span>
                  <label className="btn btn-outline btn-sm w-full">
                    Choose avatar image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => onAvatarFileChange?.(event.target.files?.[0] ?? null)}
                    />
                  </label>
                  {avatarFileName && (
                    <p className="text-xs text-base-content/60">Selected: {avatarFileName}</p>
                  )}
                </label>
              )}

            </div>

            {error && <p className="text-xs text-error">{error}</p>}
            {extraActions && <div>{extraActions}</div>}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-base-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              className="btn btn-ghost btn-sm normal-case"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm rounded-full px-4 font-semibold normal-case shrink-0 btn-outline hover:btn-neutral"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>

      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}