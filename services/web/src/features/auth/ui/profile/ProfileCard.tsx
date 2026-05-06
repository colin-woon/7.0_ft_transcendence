"use client";

import { Calendar, Mail, MapPin, Shield } from "lucide-react";
import Image from "next/image";
import type { User } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/models/AuthContext";
import { AddFriendButton, DirectMessageButton, FriendOptionsDropdown } from "@/features/chat/ui";

interface ProfileCardProps {
  user: User | null;
  profile: {
    level: number;
    levelProgress: number;
    cursus: string;
    coalition: string;
    email: string;
    location: string;
    since: string;
  };
  initials: string;
  adminActions?: React.ReactNode;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm mx-auto max-w-6xl ${className}`}
    >
      {children}
    </div>
  );
}

export default function ProfileCard({
  user,
  profile,
  initials,
  adminActions,
}: ProfileCardProps) {
  const { user: loggedInUser } = useAuth();
  const primaryEmail = user?.overflowEmail || profile.email;
  const allEmails = [
    user?.overflowEmail,
    user?.intraEmail,
    user?.googleEmail,
  ].filter((email): email is string => !!email && email.trim().length > 0);
  const loggedInUserId = loggedInUser?.id;
  const canShowPeerActions =
    loggedInUserId !== undefined &&
    typeof user?.id === "number" &&
    user.id !== loggedInUserId;

  return (
    <Card className="overflow-visible">
      <div className="h-15 bg-gradient-to-r from-[#0f6f6b] via-[#1a9e99] to-[#8EE7E3] relative rounded-t-2xl">
        <div className="absolute -bottom-10 left-6">
          {user?.avatarImage ? (
            <div className="w-20 h-20 relative rounded-2xl overflow-hidden ring-4 ring-white shadow-md">
              <Image
                src={user.avatarImage}
                alt={`${user.fullName} avatar`}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-md">
              {initials}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-14">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-slate-900">
                {user?.fullName ?? "Jane Doe"}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f6f6b] bg-[#8EE7E3]/20 px-2 py-0.5 rounded-full">
                <Shield size={11} />
                {user?.role ?? "STUDENT"}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              @{user?.username ?? "jdoe"} · {profile.cursus}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              {primaryEmail ? (
                <span className="flex items-center gap-1">
                  <Mail size={11} />
                  {primaryEmail}
                </span>
              ) : null}
              {allEmails.length > 1 && (
                <span className="flex items-center gap-1">
                  {allEmails.join(", ")}
                </span>
              )}
              {profile.location ? (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {profile.location}
                </span>
              ) : null}
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                Since {profile.since}
              </span>
            </div>

            {canShowPeerActions ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <AddFriendButton targetUserId={user.id} />
                <DirectMessageButton targetUserId={user.id} />
                <FriendOptionsDropdown friendId={user.id} isProfilePage={true} />
              </div>
            ) : null}
          </div>

          <div className="sm:min-w-[180px] space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-600">
              <span>Level {profile.level}</span>
              <span className="text-slate-400">{profile.levelProgress}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8EE7E3] to-[#0f6f6b]"
                style={{ width: `${profile.levelProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-right">
              {profile.levelProgress} / 100 XP
            </p>

            {adminActions ? (
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {adminActions}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
