'use client';

import ResourceModerationControls from './ResourceModerationControls';
import { useModerationPermissions } from './useModerationPermissions';

interface CommentModerationControlsProps {
  authorId?: number;
  isBusy?: boolean;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
}

export default function CommentModerationControls({
  authorId,
  isBusy = false,
  onEdit,
  onDelete,
}: CommentModerationControlsProps) {
  const { canModerate } = useModerationPermissions(authorId);

  return (
    <ResourceModerationControls
      resourceLabel="Comment"
      canEdit={canModerate && typeof onEdit === 'function'}
      canDelete={canModerate && typeof onDelete === 'function'}
      isBusy={isBusy}
      onEdit={onEdit}
      onDelete={onDelete}
      confirmDescription="Deleting this comment is permanent and cannot be undone."
    />
  );
}
