"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { User } from "@/features/auth/api/authService";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { useAuth } from "@/features/auth/models/AuthContext";
import { extractIntraSummary } from "@/features/auth/utils/intraDataParser";
import { getUserInitials } from "@/features/auth/utils/userInitials";
import ProfileCard from "./ProfileCard";

interface ProfilePageProps {
  viewedUserId?: number;
  initialProfile?: User | null;
  initialProfileError?: string | null;
  initialProfileErrorStatus?: number | null;
}

/**
 * Lightweight profile route that presents identity details and routes users to settings for all account operations.
 */
export default function ProfilePage({
  viewedUserId,
  initialProfile,
  initialProfileError,
  initialProfileErrorStatus,
}: ProfilePageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const viewingOwnProfile = !viewedUserId || viewedUserId === user?.id;

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    errorStatus: profileErrorStatus,
    refetch,
  } = useUserProfile(viewedUserId, {
    skip: !user || (!!viewedUserId && viewedUserId <= 0),
    initialProfile,
    initialError: initialProfileError,
    initialErrorStatus: initialProfileErrorStatus,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const activeProfile = profile ?? (viewingOwnProfile ? user : null);

  const initials = useMemo(() => {
    return getUserInitials(activeProfile?.fullName);
  }, [activeProfile]);

  const intraSummary = activeProfile?.intraInfo
    ? extractIntraSummary(activeProfile.intraInfo)
    : null;

  const profileCardData = {
    level: intraSummary?.level ?? 0,
    levelProgress: intraSummary?.levelProgress ?? 0,
    cursus: intraSummary?.activeCursus ?? "Not linked to 42 cursus",
    coalition: intraSummary?.campus?.name ?? "N/A",
    email: activeProfile?.email ?? "",
    location: intraSummary?.location ?? "",
    since: activeProfile?.createdAt
      ? new Date(activeProfile.createdAt).toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        })
      : "Unknown",
  };

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={14} className="animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={14} className="animate-spin" />
          Redirecting to login...
        </div>
      </div>
    );
  }

  if (!viewingOwnProfile && profileErrorStatus === 404) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">User not found</h2>
          <p className="text-sm text-slate-500 mt-2">
            The requested profile does not exist or is no longer available.
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Back to my profile
          </button>
        </div>
      </div>
    );
  }

  if (!viewingOwnProfile && profileErrorStatus === 403) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">Access denied</h2>
          <p className="text-sm text-slate-500 mt-2">
            You do not have permission to view this user profile.
          </p>
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Back to my profile
          </button>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Profile unavailable
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            We could not load this profile right now.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back to my profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 p-4">
      {(authError || profileError) && (
        <div className="bg-red-50 text-red-700 rounded-2xl border border-red-200 p-4 text-sm inline-flex items-start gap-2 w-full">
          <AlertCircle size={16} className="mt-0.5" />
          <span>{authError ?? profileError}</span>
        </div>
      )}

      <ProfileCard
        user={activeProfile}
        profile={profileCardData}
        initials={initials}
      />

      {!viewingOwnProfile && profileError && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-sm text-slate-600">
          <p>Failed to refresh this profile.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 btn btn-xs btn-ghost"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
