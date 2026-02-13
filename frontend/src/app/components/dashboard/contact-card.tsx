"use client"

import { Phone, Mail, MapPin, Bell, Settings, Users } from "lucide-react"

interface ContactCardProps {
  phone: string
  email: string
  location: string
  date: string
}

export function ContactCard({ phone, email, location, date }: ContactCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3a3a4a] via-[#2d2d3a] to-[#252532] p-6 shadow-xl ring-1 ring-white/10">
      {/* Glossy highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      {/* Subtle inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />

      <div className="relative">
        <div className="mb-4 flex justify-end gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20 text-gray-400 transition-colors hover:bg-primary hover:text-white">
            <Settings className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20 text-gray-400 transition-colors hover:bg-primary hover:text-white">
            <Users className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
              <Phone className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-primary">{phone}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm text-primary">{email}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
              <MapPin className="h-4 w-4 text-gray-400" />
            </div>
            <span className="text-sm text-white">{location}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/20">
              <Bell className="h-4 w-4 text-gray-400" />
            </div>
            <span className="text-sm text-white">{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
