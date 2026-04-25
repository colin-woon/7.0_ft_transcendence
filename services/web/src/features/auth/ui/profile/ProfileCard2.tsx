"use client";

import { Shield } from "lucide-react";
import Image from "next/image";
import guestImg from "@/components/ui/imgs/guest_img.png";
import type { User } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/models/AuthContext";
import { AddFriendButton, DirectMessageButton } from "@/features/chat/ui";

interface ProfileCard2Props {
  user: User | null;
  profile: {
    level: number;
    levelProgress: number;
    cursus: string;
    coalition: string;
    email: string;
    location: string;
    since: string;
    wallet?: number;
    evalPoints?: number;
    projectsCount?: number;
    pool?: string;
  };
  initials: string;
  subscribedProjects?: any[];
  adminActions?: React.ReactNode;
  bio?: string | null;
}

export default function ProfileCard2({
  user,
  profile,
  initials,
  subscribedProjects = [],
  adminActions,
  bio,
}: ProfileCard2Props) {
  const { user: loggedInUser } = useAuth();
  const loggedInUserId = loggedInUser?.id;
  const canShowPeerActions =
    loggedInUserId !== undefined &&
    typeof user?.id === "number" &&
    user.id !== loggedInUserId;
    const profileCardData = {
      projectsCount: subscribedProjects.length,
    };

  const displayBio = bio ?? user?.bio ?? null;

  const stats = [
    { label: "Wallet", value: profile.wallet ?? 0 },
    { label: "Eval.P", value: profile.evalPoints ?? 0 },
    { label: "Projects", value: subscribedProjects.length ?? 0 },
  ];

  return (
    <div className="card bg-base-100 shadow-md rounded-xl p-4 flex flex-col md:flex-row items-center gap-5">
      
      {/* 1. Avatar Section */}
      <div className="avatar shrink-0">
        <div className="relative w-19 h-19 sm:w-18 sm:h-18 rounded-full ring-2 ring-black overflow-hidden">
          <Image
            src={user?.avatarImage || guestImg}
            alt={`${user?.fullName || initials} avatar`}
            fill
            sizes="(max-width: 640px) 64px, 80px"
            className="object-cover object-center"
            unoptimized
          />
        </div>
      </div>

      {/* 2. info Column */}
      <div className="flex-auto min-w-0 flex flex-col gap-[6px]">
        <div className="flex items-center gap-[7px] flex-wrap">
          <span className="text-2xl font-medium text-[#1a1a1a] leading-none tracking-tight">
            {user?.fullName ?? "Jane Doe"}
          </span>
          <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold uppercase tracking-[0.5px] text-[#0b5855] bg-[#0f6f6b]/[0.09] border border-[#0f6f6b]/[0.22] px-[7px] py-[2px] rounded-full leading-[1.7]">
            <Shield size={9} strokeWidth={2.5} />
            {user?.role ?? "Student"}
          </span>

          {/* Action Group */}
          <div className="flex items-center gap-2 ml-1">
            {canShowPeerActions && (
              <div className="flex items-center gap-2">
                <AddFriendButton targetUserId={user.id} />
                <DirectMessageButton targetUserId={user.id} />
              </div>
            )}

            {adminActions && (
              <div className="flex items-center border-l border-gray-200 pl-2 gap-2">
                {adminActions}
              </div>
            )}
          </div>
        </div>

        {/* meta data */}
        <div className="flex items-center text-sm text-gray-400 flex-wrap leading-[1.4]">
          <span>@{user?.username ?? "jdoe"}</span>
          <span className="mx-[5px] opacity-40">·</span>
          <span>{profile.cursus}</span>
          <span className="mx-[5px] opacity-40">·</span>
          <span>{user?.email ?? profile.email}</span>
          {profile.pool && profile.pool !== "N/A" && (
            <>
              <span className="mx-[5px] opacity-40">·</span>
              <span>since {profile.pool}</span>
            </>
          )}
          {profile.location && (
            <>
              <span className="mx-[5px] opacity-40">·</span>
              <span>{profile.location}</span>
            </>
          )}
        </div>

        {/* Bio */}
        {displayBio ? (
          <p className="text-sm text-gray-600 leading-relaxed mt-[1px]">
            {displayBio}
          </p>
        ) : (
          <p className="text-sm italic text-gray-400 leading-[1.4]">
            No bio yet.
          </p>
        )}

        {/* XP bar */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
            Lv. {Math.floor(profile.level)}
          </span>
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[#0f6f6b] transition-all"
              style={{ width: `${profile.levelProgress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {profile.levelProgress}%
          </span>
        </div>
      </div>

      {/* 3. Stats Section */}
      <div className="flex flex-wrap items-center justify-center w-full md:w-auto shrink-0 px-2 md:px-0">
        {stats.map(({ label, value }, i) => (
          <div key={label} className="flex items-center">
            {i > 0 && (
              <div className="w-px bg-gray-100 self-stretch my-[6px]" />
            )}
            <div className="flex flex-col items-center gap-[3px] px-[18px] py-[6px] min-w-[60px]">
              <span className="text-xs uppercase tracking-[0.5px] text-gray-400 font-medium">
                {label}
              </span>
              <span className="text-lg font-semibold text-[#1a1a1a] leading-none tracking-tight">
                {value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div> 
  );
}