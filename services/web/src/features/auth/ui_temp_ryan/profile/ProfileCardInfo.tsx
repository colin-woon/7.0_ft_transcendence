
import { Mail, MapPin, Calendar, Shield } from "lucide-react";
import { User } from "@/features/auth/api/authService";
import React from "react";

interface ProfileCardInfoProps {
  user: User | null;
  profile: {
    cursus: string;
    email: string;
    location: string;
    since: string;
  };
}

export default function ProfileCardInfo({ user, profile }: ProfileCardInfoProps) {
  return (
    <div className="sm:pl-2">
      {/* Name */}
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
        {user?.fullName ?? "Jane Doe"}
      </h2>
      
      {/* Identity row: Username, Badge, Cursus */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm font-medium text-slate-500">@{user?.username ?? "jdoe"}</span>
        <span className="text-slate-300">•</span>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
          user?.role === "ADMIN" 
            ? "text-orange-600 bg-orange-100/80" 
            : "text-[#0f6f6b] bg-[#8EE7E3]/20"
        }`}>
          <Shield size={12} strokeWidth={2.5} />{user?.role ?? "STUDENT"}
        </span>
        <span className="text-slate-300">•</span>
        <span className="text-sm text-slate-500">{profile.cursus}</span>
      </div>

      {/* Bio */}
      {user?.bio && (
        <p className="text-sm text-slate-600 leading-relaxed mb-4 max-w-lg">
          {user.bio}
        </p>
      )}

      {/* Meta Icons */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
        <span className="flex items-center gap-1.5"><Mail size={14} />{user?.email ?? profile.email}</span>
        {profile.location ? (
            <span className="flex items-center gap-1.5"><MapPin size={14} />{profile.location}</span>
        ) : null}
        <span className="flex items-center gap-1.5"><Calendar size={14} />Since {profile.since}</span>
      </div>
    </div>
  );
}