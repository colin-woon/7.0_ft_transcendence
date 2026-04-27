"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppShell } from "@/components/ui/ComponentLogic/Appshell/context/AppShellContext";

export default function Header() {
  const { toggleSidebar } = useAppShell();

  return (
    <header className="h-16 bg-white text-slate-900 z-[60] border-b border-gray-200 w-full shadow-sm px-4 pr-2">
      <div className="max-w-7xl h-full flex items-center py-3">
        <div className="flex items-center justify-between w-full">
          {/* Left: Sidebar + Brand */}
          <div className="flex items-center gap-2 min-w-0 w-auto lg:w-64 justify-start shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center shrink-0 rounded-full p-2 text-slate-700 hover:bg-black/5 transition sm:ml-4"
              aria-label="Toggle sidebar"
            >
              <Menu
                size={20}
                className="block h-5 w-5 text-slate-700"
                strokeWidth={2.25}
              />
            </button>
            <Link
              href="/projects"
              className="pl-3 text-base-content text-xl font-bold inline hover:text-secondary transition-colors ml-4"
            >
              <Image
                src="/assets/42overflow.png"
                alt="42 Overflow Logo"
                width={204}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Center: Spacer */}
          <div className="flex-1" />

          <div className="w-auto lg:w-64 shrink-0" />
        </div>
      </div>
    </header>
  );
}
