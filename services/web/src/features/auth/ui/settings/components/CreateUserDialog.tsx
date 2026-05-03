import React from "react";

type CreateUserDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  draft: {
    username: string;
    fullName: string;
    email: string;
    bio?: string;
    role: string;
    isBanned: boolean;
  };
  onChange: (key: string, value: any) => void;
  loading: boolean;
  error?: string | null;
};

export default function CreateUserDialog({
  open,
  onClose,
  onSubmit,
  draft,
  onChange,
  loading,
  error,
}: CreateUserDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-base-100 rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
        <button
          className="absolute top-2 right-2 btn btn-xs btn-ghost"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-4">Create User</h2>
        {error && <div className="alert alert-error mb-2">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
            <label className="flex flex-col gap-1.5 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">Username</span>
              <input
                className="input h-10 w-full rounded-md text-sm bg-base-100 shadow-sm border border-base-200 focus:outline-none focus:border-base-300 focus:ring-2 focus:ring-base-300/50 transition-all"
                placeholder="jothomas"
                value={draft.username}
                onChange={e => onChange("username", e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">Full name</span>
              <input
                className="input h-10 w-full rounded-md text-sm bg-base-100 shadow-sm border border-base-200 focus:outline-none focus:border-base-300 focus:ring-2 focus:ring-base-300/50 transition-all"
                placeholder="Joshua Thomas"
                value={draft.fullName}
                onChange={e => onChange("fullName", e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">Email</span>
              <input
                className="input h-10 rounded-md text-sm bg-base-100 shadow-sm border border-base-200 focus:outline-none focus:border-base-300 focus:ring-2 focus:ring-base-300/50 transition-all w-full"
                placeholder="42overflow@example.com"
                type="email"
                value={draft.email}
                onChange={e => onChange("email", e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Bio <span className="normal-case font-normal tracking-normal text-base-content/40">(optional)</span>
              </span>
              <textarea
                className="textarea rounded-md text-sm bg-base-100 min-h-24 resize-none leading-relaxed shadow-sm py-3 w-full border border-base-200 focus:outline-none focus:border-base-300 focus:ring-2 focus:ring-base-300/50 transition-all"
                placeholder="Short profile bio..."
                maxLength={100}
                value={draft.bio ?? ""}
                onChange={e => onChange("bio", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">Role</span>
              <div className="relative w-full">
                <select
                  className="appearance-none w-full h-10 min-h-0 px-4 rounded-md text-sm bg-base-100 shadow-sm border border-base-300 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all cursor-pointer"
                  value={draft.role}
                  onChange={e => onChange("role", e.target.value)}
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-base-content/50">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">Initial status</span>
              <div className="relative w-full">
                <select
                  className="appearance-none w-full h-10 min-h-0 px-4 rounded-md text-sm bg-base-100 shadow-sm border border-base-300 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all cursor-pointer"
                  value={draft.isBanned ? "banned" : "active"}
                  onChange={e => onChange("isBanned", e.target.value === "banned")}
                >
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-base-content/50">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </label>
          </div>
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-base-200">
            <span className="text-xs text-base-content/40">All fields required unless marked optional.</span>
            <button
              className="inline-flex items-center shrink-0 rounded-full px-4 h-8 text-sm font-semibold
                            bg-base-content text-base-100
                            hover:bg-base-content/90 active:bg-base-content/90
                            transition-colors duration-150 cursor-pointer select-none"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}