"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthApiError, authService } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/models/AuthContext";

export function useAuthorNames(userIds: Array<number | undefined>) {
  const { user } = useAuth();
  const requestedIdsRef = useRef<Set<string>>(new Set());
  const [nameById, setNameById] = useState<Record<number, string | null>>({});
  const viewerRole = user?.role;

  const uniqueIds = useMemo(
    () =>
      Array.from(
        new Set(userIds.filter((id): id is number => typeof id === "number")),
      ),
    [userIds],
  );

  useEffect(() => {
    const roleKey = viewerRole ?? "ANON";
    const missingIds = uniqueIds.filter(
      (id) => !requestedIdsRef.current.has(`${roleKey}:${id}`),
    );

    if (missingIds.length === 0) {
      return;
    }

    for (const id of missingIds) {
      requestedIdsRef.current.add(`${roleKey}:${id}`);
    }

    let cancelled = false;

    const load = async () => {
      const resolved = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const nextUser = await authService.getUserById(id);
            const baseName =
              nextUser.username?.trim() || nextUser.fullName?.trim() || null;

            return { id, displayName: baseName };
          } catch (error) {
            if (
              viewerRole === "STUDENT" &&
              error instanceof AuthApiError &&
              error.status === 403
            ) {
              return { id, displayName: "Admin" };
            }

            return { id, displayName: null };
          }
        }),
      );

      if (cancelled) {
        return;
      }

      setNameById((prev) => {
        const next = { ...prev };
        for (const entry of resolved) {
          next[entry.id] = entry.displayName;
        }
        return next;
      });
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [uniqueIds, viewerRole]);

  return useCallback(
    (authorId?: number) => {
      if (typeof authorId !== "number") {
        return "(deleted)";
      }

      if (user?.id === authorId) {
        return "me";
      }

      const name = nameById[authorId];
      if (typeof name === "string" && name.length > 0) {
        return name;
      }

      return "(deleted)";
    },
    [nameById, user?.id],
  );
}
