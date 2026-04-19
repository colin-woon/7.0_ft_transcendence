"use client";

import { AlertTriangle } from "lucide-react";

export interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading?: boolean;
  tone?: "warning" | "danger";
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/**
 * Reusable confirmation modal for destructive or security-sensitive actions.
 */
export default function ConfirmActionDialog({
  open,
  title,
  message,
  confirmLabel,
  loading = false,
  tone = "warning",
  onConfirm,
  onClose,
}: ConfirmActionDialogProps) {
  const confirmClass = tone === "danger" ? "btn btn-error" : "btn btn-warning";

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="modal-box border border-base-300">
        <div className="inline-flex items-center gap-2 mb-2 text-warning">
          <AlertTriangle size={18} />
          <h3 className="font-bold text-lg text-base-content">{title}</h3>
        </div>
        <p className="text-sm text-base-content/70">{message}</p>
        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={confirmClass}
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
