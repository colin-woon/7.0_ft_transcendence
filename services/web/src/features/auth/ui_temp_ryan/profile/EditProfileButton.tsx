import React from "react";

interface EditProfileButtonProps {
  onClick: () => void;
  className?: string;
}

export default function EditProfileButton({ onClick, className = "" }: EditProfileButtonProps) {
  return (
    <button
      type="button"
      className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-slate-600 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition ${className}`}
      onClick={onClick}
    >
      Edit Profile
    </button>
  );
}
