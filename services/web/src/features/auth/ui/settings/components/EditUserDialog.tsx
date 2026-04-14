"use client";

export interface EditUserDraft {
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
}

export interface EditUserDialogProps {
  open: boolean;
  title: string;
  draft: EditUserDraft;
  saving?: boolean;
  error?: string | null;
  onChange: (next: Partial<EditUserDraft>) => void;
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
  saving = false,
  error,
  onChange,
  onClose,
  onSubmit,
}: EditUserDialogProps) {
  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box bg-base-100 border border-base-200">
        <h3 className="font-bold text-lg">{title}</h3>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <input
            className="input input-bordered w-full"
            placeholder="Username"
            value={draft.username}
            onChange={(event) => onChange({ username: event.target.value })}
          />
          <input
            className="input input-bordered w-full"
            placeholder="Full name"
            value={draft.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
          />
          <input
            className="input input-bordered w-full"
            placeholder="Avatar URL"
            value={draft.avatarUrl}
            onChange={(event) => onChange({ avatarUrl: event.target.value })}
          />
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Bio"
            value={draft.bio}
            onChange={(event) => onChange({ bio: event.target.value })}
          />
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
