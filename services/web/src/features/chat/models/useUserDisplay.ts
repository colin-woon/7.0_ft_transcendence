"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthApiError, authService } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/models/AuthContext";

interface ResolvedUserDisplay {
  displayName: string;
  avatarImage: string | null;
}

interface CachedUserDisplay {
  displayName: string | null;
  avatarImage: string | null;
}

export function useUserDisplay(userIds: Array<number | undefined>) {
  const { user } = useAuth();
  const viewerRole = user?.role;
  const requestedIdsRef = useRef<Set<string>>(new Set());
  const inFlightIdsRef = useRef<Set<string>>(new Set());
  const [displayById, setDisplayById] = useState<
    Record<number, CachedUserDisplay>
  >({});

  const uniqueIds = useMemo(
    () =>
      Array.from(
        new Set(
          userIds.filter(
            (id): id is number => typeof id === "number" && id > 0,
          ),
        ),
      ),
    [userIds],
  );

  useEffect(() => {
    const roleKey = viewerRole ?? "ANON";
    const idsToLoad = uniqueIds.filter((id) => {
      const requestKey = `${roleKey}:${id}`;
      return (
        !requestedIdsRef.current.has(requestKey) &&
        !inFlightIdsRef.current.has(requestKey)
      );
    });

    if (idsToLoad.length === 0) {
      return;
    }

    for (const id of idsToLoad) {
      inFlightIdsRef.current.add(`${roleKey}:${id}`);
    }

    let cancelled = false;

    const load = async () => {
      const resolved = await Promise.all(
        idsToLoad.map(async (id) => {
          const requestKey = `${roleKey}:${id}`;
          try {
            const nextUser = await authService.getUserById(id);
            const baseName =
              nextUser.username?.trim() || nextUser.fullName?.trim() || null;
            const avatarImage = nextUser.avatarImage ?? nextUser.avatarUrl ?? null;

            return {
              id,
              requestKey,
              display: {
                displayName: baseName,
                avatarImage,
              },
            };
          } catch (error) {
            if (
              viewerRole === "STUDENT" &&
              error instanceof AuthApiError &&
              error.status === 403
            ) {
              return {
                id,
                requestKey,
                display: {
                  displayName: "Admin",
                  avatarImage: null,
                },
              };
            }

            return {
              id,
              requestKey,
              display: {
                displayName: null,
                avatarImage: null,
              },
            };
          }
        }),
      );

      for (const entry of resolved) {
        inFlightIdsRef.current.delete(entry.requestKey);
      }

      if (cancelled) {
        return;
      }

      setDisplayById((prev) => {
        const next = { ...prev };
        for (const entry of resolved) {
          next[entry.id] = entry.display;
          if (entry.display.displayName) {
            requestedIdsRef.current.add(entry.requestKey);
          }
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
    (targetUserId?: number): ResolvedUserDisplay => {
      if (typeof targetUserId !== "number" || targetUserId <= 0) {
        return { displayName: "(deleted)", avatarImage: null };
      }

      if (user?.id === targetUserId) {
        return {
          displayName: "me",
          avatarImage: user.avatarImage ?? user.avatarUrl ?? null,
        };
      }

      const cached = displayById[targetUserId];
      if (cached?.displayName) {
        return {
          displayName: cached.displayName,
          avatarImage: cached.avatarImage,
        };
      }

      return { displayName: "(deleted)", avatarImage: null };
    },
    [displayById, user],
  );
}
