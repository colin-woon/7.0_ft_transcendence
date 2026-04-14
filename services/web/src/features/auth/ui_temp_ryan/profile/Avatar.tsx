import React from "react";

interface AvatarProps {
  avatarUrl?: string | null;
  fullName?: string;
  initials: string;
}

export default function Avatar({ avatarUrl, fullName, initials }: AvatarProps) {
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={fullName ? `${fullName} avatar` : "User avatar"}
      className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
    />
  ) : (
    <div className="py-4 w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-600 text-2xl font-bold ring-4 ring-white shadow-md">
      {initials}
    </div>
  );
}
