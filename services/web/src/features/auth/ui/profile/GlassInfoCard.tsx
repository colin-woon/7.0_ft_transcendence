import React from "react";
import { cn } from "@/lib/utils";

interface GlassInfoCardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}

export default function GlassInfoCard({
  title = "42 Info",
  subtitle = "(information retrieved from 42 api)",
  className = "",
  children,
}: GlassInfoCardProps) {
  return (
    <div
      className={cn(
        "relative backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl overflow-hidden",
        className
      )}
    >
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">{title}</h2>
          <span className="text-[10px] text-slate-500/70 ml-2">
            {subtitle}
          </span>
        </div>
      </div>
      <div className="p-4 pb-4 pt-0">{children}</div>
    </div>
  );
}


