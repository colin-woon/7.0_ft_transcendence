'use client';

import { useAuth } from '@/features/auth/models/AuthContext';

export function useModerationPermissions(authorId?: number) {
  const { user, hasRole, isAuthenticated } = useAuth();

  const isAdmin = hasRole('ADMIN');
  const currentUserId = user?.id;
  const isOwner = typeof authorId === 'number' && typeof currentUserId === 'number' && authorId === currentUserId;
  const canModerate = Boolean(isAuthenticated && (isAdmin || isOwner));

  return {
    isAdmin,
    isOwner,
    canModerate,
    currentUserId,
  };
}
