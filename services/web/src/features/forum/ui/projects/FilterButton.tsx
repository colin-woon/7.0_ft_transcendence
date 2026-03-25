import React from "react";
import { Difficulty } from "../../../models/projects";

interface FilterButtonsProps {
  filters: ("All" | Difficulty)[];
  activeFilter: "All" | Difficulty;
  onChange: (filter: "All" | Difficulty) => void;
}

export function FilterButtons({ filters, activeFilter, onChange }: FilterButtonsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            activeFilter === f
              ? "bg-[#0f6f6b] text-white"
              : "bg-gray-100 text-slate-600 hover:bg-[#8EE7E3]/30"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}