"use client"

import { Monitor, Star, Coins, ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface Achievement {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
}

interface AchievementsCardProps {
  achievements: Achievement[]
}

export function AchievementsCard({ achievements }: AchievementsCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Last Achievements</h3>
        <button className="flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white">
          See All Achievements
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-gray-100"
          >
            <div>
              <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
              <p className="mt-0.5 text-xs text-gray-500">{achievement.description}</p>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${achievement.color}20` }}
            >
              <achievement.icon className="h-6 w-6" style={{ color: achievement.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const achievementIcons = {
  codeExplorer: Monitor,
  bonusHunter: Star,
  richWorld: Coins,
}
