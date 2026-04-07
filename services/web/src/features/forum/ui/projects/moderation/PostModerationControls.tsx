'use client';

import ResourceModerationControls from './ResourceModerationControls';
import { useModerationPermissions } from './useModerationPermissions';

interface PostModerationControlsProps {
  authorId?: number;
  isBusy?: boolean;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
}

export default function PostModerationControls({
  authorId,
  isBusy = false,
  onEdit,
  onDelete,
}: PostModerationControlsProps) {
  const { canModerate } = useModerationPermissions(authorId);

  return (
    <ResourceModerationControls
      resourceLabel="Post"
      canEdit={canModerate && typeof onEdit === 'function'}
      canDelete={canModerate && typeof onDelete === 'function'}
      isBusy={isBusy}
      onEdit={onEdit}
      onDelete={onDelete}
      confirmDescription="Deleting this post will also remove its comments. This cannot be undone."
    />
  );
}
