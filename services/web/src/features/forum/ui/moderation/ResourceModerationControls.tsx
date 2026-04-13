'use client';

import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import ModerationActionButton from './ModerationActionButton';
import ConfirmModerationDialog from './ConfirmModerationDialog';

interface ResourceModerationControlsProps {
  resourceLabel: string;
  canEdit?: boolean;
  canDelete?: boolean;
  isBusy?: boolean;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  confirmDescription?: string;
}

export default function ResourceModerationControls({
  resourceLabel,
  canEdit = false,
  canDelete = false,
  isBusy = false,
  onEdit,
  onDelete,
  confirmDescription,
}: ResourceModerationControlsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canRender = useMemo(() => {
    return (
      (canEdit && typeof onEdit === 'function') ||
      (canDelete && typeof onDelete === 'function')
    );
  }, [canDelete, canEdit, onDelete, onEdit]);

  if (!canRender) {
    return null;
  }

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
      setIsConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-1">
        {canEdit && onEdit && (
          <ModerationActionButton
            icon={<Pencil size={14} />}
            label={`Edit ${resourceLabel}`}
            disabled={isBusy || isDeleting}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onEdit();
            }}
          />
        )}

        {canDelete && onDelete && (
          <ModerationActionButton
            icon={<Trash2 size={14} />}
            label={`Delete ${resourceLabel}`}
            variant="danger"
            disabled={isBusy || isDeleting}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsConfirmOpen(true);
            }}
          />
        )}
      </div>

      <ConfirmModerationDialog
        isOpen={isConfirmOpen}
        title={`Delete ${resourceLabel}?`}
        description={
          confirmDescription ??
          `This action is permanent. The ${resourceLabel.toLowerCase()} will be removed immediately.`
        }
        confirmLabel="Delete"
        isSubmitting={isDeleting}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
