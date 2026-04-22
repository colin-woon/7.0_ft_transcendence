"use client";
 
import { Shield } from "lucide-react";
import Image from "next/image";
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
  };
  initials: string;
  adminActions?: React.ReactNode;
}
 
export default function ProfileCard2({
  user,
  profile,
  initials,
  adminActions,
}: ProfileCard2Props) {
  const { user: loggedInUser } = useAuth();
  const loggedInUserId = loggedInUser?.id;
  const canShowPeerActions =
    loggedInUserId !== undefined &&
    typeof user?.id === "number" &&
    user.id !== loggedInUserId;
 
  return (
    <div className="w-full bg-white border border-gray-200 rounded-md px-6 py-5 flex items-center gap-5">
      {/* Avatar */}
      <div className="shrink-0">
        {user?.avatarImage ? (
          <div className="w-14 h-14 rounded-full overflow-hidden relative">
            <Image
              src={user.avatarImage}
              alt={`${user.fullName} avatar`}
              fill
              sizes="56px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#1c1c1e] flex items-center justify-center">
            <span className="text-lg font-bold text-white tracking-tight">
              {initials}
            </span>
          </div>
        )}
      </div>
 
      {/* Identity + XP */}
      <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
        {/* Name + badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[17px] font-bold text-[#1a1a1a] leading-none tracking-tight">
            {user?.fullName ?? "Jane Doe"}
          </span>
          <span className="inline-flex items-center gap-[3px] text-[10px] font-semibold uppercase tracking-[0.5px] text-[#0f6f6b] bg-[#0f6f6b]/[0.08] border border-[#0f6f6b]/[0.18] px-[7px] py-[2px] rounded-full leading-relaxed">
            <Shield size={9} strokeWidth={2.5} />
            {user?.role ?? "Student"}
          </span>
        </div>
 
        {/* Handle + cursus */}
        <div className="text-[12px] text-gray-400 font-normal">
          @{user?.username ?? "jdoe"}&nbsp;·&nbsp;{profile.cursus}
        </div>
 
        {/* Meta */}
        <div className="flex items-center text-[11.5px] text-gray-300 gap-0">
          <span>{user?.email ?? profile.email}</span>
          <span className="mx-[5px] text-gray-200">·</span>
          <span>Since {profile.since}</span>
          {profile.location ? (
            <>
              <span className="mx-[5px] text-gray-200">·</span>
              <span>{profile.location}</span>
            </>
          ) : null}
        </div>
 
        {/* XP bar */}
        <div className="flex items-center gap-[9px] mt-[1px]">
          <span className="text-[11.5px] font-semibold text-[#444] whitespace-nowrap">
            Lv.&nbsp;{profile.level}
          </span>
          <div className="flex-1 h-[4px] bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0f6f6b] rounded-full"
              style={{ width: `${Math.max(profile.levelProgress, 1)}%` }}
            />
          </div>
          <span className="text-[11px] text-gray-300 whitespace-nowrap">
            {profile.levelProgress}%
          </span>
        </div>
 
        {/* Peer actions */}
        {canShowPeerActions ? (
          <div className="flex flex-wrap gap-2 mt-1">
            <AddFriendButton targetUserId={user.id} />
            <DirectMessageButton targetUserId={user.id} />
          </div>
        ) : null}
 
        {adminActions ? <div className="mt-1">{adminActions}</div> : null}
      </div>
 
      {/* Divider */}
      <div className="w-px h-11 bg-gray-100 shrink-0" />
 
      {/* Stats */}
      <div className="flex gap-1 shrink-0">
        <div className="flex flex-col items-center gap-[2px] px-4 py-[6px] min-w-[64px]">
          <span className="text-[10px] uppercase tracking-[0.5px] text-gray-300 font-medium">
            Wallet
          </span>
          <span className="text-[17px] font-bold text-[#1a1a1a] leading-none tracking-tight">
            {profile.wallet ?? 0}
          </span>
        </div>
        <div className="flex flex-col items-center gap-[2px] px-4 py-[6px] min-w-[64px]">
          <span className="text-[10px] uppercase tracking-[0.5px] text-gray-300 font-medium">
            Eval
          </span>
          <span className="text-[17px] font-bold text-[#1a1a1a] leading-none tracking-tight">
            {profile.evalPoints ?? 0}
          </span>
        </div>
        <div className="flex flex-col items-center gap-[2px] px-4 py-[6px] min-w-[64px]">
          <span className="text-[10px] uppercase tracking-[0.5px] text-gray-300 font-medium">
            Projects
          </span>
          <span className="text-[17px] font-bold text-[#1a1a1a] leading-none tracking-tight">
            {profile.projectsCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}