"use client";

import { UserX } from "lucide-react";

interface UserAdminActionButtonsProps {
  onEdit: () => void;
  onForceLogout: () => void;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Shared admin-only user actions used across search and profile surfaces.
 */
export default function UserAdminActionButtons({
  onEdit,
  onForceLogout,
  disabled = false,
  compact = false,
}: UserAdminActionButtonsProps) {
  return (
    <>
      <button
        type="button"
        className={
          compact ? "btn btn-xs btn-neutral" : "btn btn-sm btn-neutral"
        }
        onClick={onEdit}
        disabled={disabled}
      >
        Edit profile
      </button>

      <button
        type="button"
        className={
          compact ? "btn btn-xs btn-warning" : "btn btn-sm btn-warning"
        }
        onClick={onForceLogout}
        disabled={disabled}
      >
        <UserX size={12} />
        Force logout
      </button>
    </>
  );
}
