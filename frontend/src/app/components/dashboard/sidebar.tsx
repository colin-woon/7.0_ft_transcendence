"use client"

import { User, Shirt, Settings, Calendar, Award, ShoppingCart, RotateCcw, Search, Bell } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: User, label: "Profile", active: true },
  { icon: Shirt, label: "Appearance" },
  { icon: Settings, label: "Settings" },
  { icon: Calendar, label: "Calendar" },
  { icon: Award, label: "Achievements" },
  { icon: ShoppingCart, label: "Shop" },
  { icon: RotateCcw, label: "History" },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center bg-[#1a1a24] py-4">
      <div className="mb-8 flex h-10 w-10 items-center justify-center">
        <svg viewBox="0 0 137.52 96.5" className="h-8 w-8 fill-white">
          <path d="M137.52,0H0V96.5H45.07V45.07H92.45V96.5h45.07V0ZM76.56,76.56V60.67H60.67V76.56H45.07V45.07H92.45V76.56Z" transform="translate(0 0)" />
        </svg>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              item.active
                ? "bg-primary text-[#1a1a24]"
                : "text-gray-500 hover:bg-gray-800 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="pointer-events-none absolute left-14 z-50 whitespace-nowrap rounded bg-[#2d2d3a] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

export function TopBar({ username, avatar }: { username: string; avatar: string }) {
  return (
    <header className="fixed left-16 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search"
          className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
            3
          </span>
        </button>
        <span className="text-sm font-medium text-gray-900">{username}</span>
        <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-primary">
          <img src={avatar || "/placeholder.svg"} alt={username} className="h-full w-full object-cover" />
        </div>
      </div>
    </header>
  )
}
