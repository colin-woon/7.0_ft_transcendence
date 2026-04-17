"use client";

import { useCallback, useState } from "react";
import type {
  AdminUpdatePayload,
  CreateUserPayload,
  User,
} from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/models/AuthContext";

export function useAdminUsers() {
  const { adminUpdateUser, adminLogoutUser, adminCreateUser, adminDeleteUser } =
    useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        return await action();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Admin action failed";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateUser = useCallback(
    async (
      userId: number,
      payload: AdminUpdatePayload,
    ): Promise<User | null> => {
      return wrap(() => adminUpdateUser(userId, payload));
    },
    [adminUpdateUser, wrap],
  );

  const logoutUser = useCallback(
    async (userId: number): Promise<boolean> => {
      const result = await wrap(async () => {
        await adminLogoutUser(userId);
        return true;
      });
      return !!result;
    },
    [adminLogoutUser, wrap],
  );

  const createUser = useCallback(
    async (payload: CreateUserPayload): Promise<User | null> => {
      return wrap(() => adminCreateUser(payload));
    },
    [adminCreateUser, wrap],
  );

  const deleteUser = useCallback(
    async (userId: number): Promise<boolean> => {
      const result = await wrap(async () => {
        await adminDeleteUser(userId);
        return true;
      });
      return !!result;
    },
    [adminDeleteUser, wrap],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    updateUser,
    logoutUser,
    createUser,
    deleteUser,
  };
}
