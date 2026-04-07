'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/models/AuthContext';

interface AdminVisibilityGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminVisibilityGate({ children, fallback = null }: AdminVisibilityGateProps) {
  const { hasRole } = useAuth();

  if (!hasRole('ADMIN')) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
