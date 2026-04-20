import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface PasswordFormProps {
  passwordOpen: boolean;
  setPasswordOpen: (open: boolean) => void;
  passwordForm: {
    currentPassword?: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordForm: React.Dispatch<React.SetStateAction<any>>;
  passwordErrors: Record<string, string>;
  passwordFormError: string | null;
  passwordFormSuccess: string | null;
  passwordSaving: boolean;
  handlePasswordUpdate: (e: React.FormEvent<HTMLFormElement>) => void;
  activeProfile: any;
}

export const PasswordForm: React.FC<PasswordFormProps> = ({
  passwordOpen,
  setPasswordOpen,
  passwordForm,
  setPasswordForm,
  passwordErrors,
  passwordFormError,
  passwordFormSuccess,
  passwordSaving,
  handlePasswordUpdate,
  activeProfile,
}) => (
  <AnimatePresence initial={false}>
    {passwordOpen && (
      <motion.form
        key="password-form"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 10, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
        onSubmit={handlePasswordUpdate}
      >
        <div className="px-5 py-5 space-y-5">
          {activeProfile.hasPassword && (
            <div className="pb-4 border-b border-base-200/60">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/100">
                  Current password
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  className="input h-10 w-full rounded-md text-sm bg-base-100 border-neutral/70 border-2 focus:border-neutral focus:ring-1 focus:ring-neutral/30 focus:outline-none transition-all placeholder:text-base-content/40"
                  value={passwordForm.currentPassword ?? ""}
                  onChange={(event) =>
                    setPasswordForm((prev: any) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-error mt-1">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </label>
            </div>
          )}

          <div className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/100">
                {activeProfile.hasPassword ? "New password" : "Create password"}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder={
                  activeProfile.hasPassword
                    ? "Enter new password"
                    : "Create a password"
                }
                className="input h-10 w-full rounded-md text-sm bg-base-100 border-neutral/70 border-2 focus:border-neutral focus:ring-1 focus:ring-neutral/30 focus:outline-none transition-all placeholder:text-base-content/40"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev: any) => ({
                    ...prev,
                    newPassword: event.target.value,
                  }))
                }
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-error mt-1">
                  {passwordErrors.newPassword}
                </p>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/100">
                Confirm password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                className="input h-10 w-full rounded-md text-sm bg-base-100 border-neutral/70 border-2 focus:border-neutral focus:ring-1 focus:ring-neutral/30 focus:outline-none transition-all placeholder:text-base-content/40"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((prev: any) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-error mt-1">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </label>
          </div>

          {passwordFormError && (
            <p className="text-xs text-error">{passwordFormError}</p>
          )}
          {passwordFormSuccess && (
            <p className="text-xs text-success">{passwordFormSuccess}</p>
          )}
        </div>

        <div className="px-5 py-4 bg-base-100/50 flex justify-end gap-3 border-t border-base-200">
          <button
            type="button"
            className="btn btn-ghost btn-sm normal-case font-medium text-base-content/70 hover:text-base-content"
            onClick={() => setPasswordOpen(false)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-sm rounded-md px-5 normal-case font-semibold"
            disabled={passwordSaving}
          >
            {passwordSaving
              ? "Saving..."
              : activeProfile.hasPassword
              ? "Change password"
              : "Create password"}
          </button>
        </div>
      </motion.form>
    )}
  </AnimatePresence>
);

export default PasswordForm;