import React from "react";
import { Settings } from "lucide-react";

interface GearboxButtonProps {
  onClick: () => void;
  className?: string;
  title?: string;
}

export default function GearboxButton({ onClick, className = "", title = "Settings" }: GearboxButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={`shrink-0 flex items-center justify-center px-2 py-1.5 rounded-lg border border-gray-200 text-slate-600 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition ${className}`}
      onClick={onClick}
    >
      <Settings className="w-4 h-4" />
    </button>
  );
}