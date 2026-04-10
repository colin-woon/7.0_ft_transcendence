"use client";

import React from "react";

interface ProfileLevelBarProps {
  level: number;
  levelProgress: number;
}

export default function ProfileLevelBar({ level, levelProgress }: ProfileLevelBarProps) {
  return (
    <div className="sm:w-full space-y-1.5 sm:mt-0 sm:pr-4">
      <div className="flex justify-between text-sm font-medium text-slate-600">
        <span>Level {level}</span>
        <span className="text-slate-400">{levelProgress}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8EE7E3] to-[#0f6f6b]"
          style={{ width: `${levelProgress}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 text-right">{levelProgress} / 100 XP</p>
    </div>
  );
}