"use client"

interface MilestoneCardProps {
  pace: number
  deadline: string
  daysElapsed: number
  daysTotal: number
}

export function MilestoneCard({ pace, deadline, daysElapsed, daysTotal }: MilestoneCardProps) {
  const percentage = (daysElapsed / daysTotal) * 100

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3a3a4a] via-[#2d2d3a] to-[#252532] p-6 shadow-xl ring-1 ring-white/10">
      {/* Glossy highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      {/* Subtle inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Pace</span>
            <p className="text-3xl font-bold text-white">{pace}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Milestone Deadline</span>
            <p className="text-lg font-semibold text-primary">{deadline}</p>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Elapsed time</span>
          
          <div className="mt-4 flex items-center justify-center">
            {/* Circular progress */}
            <div className="relative">
              <svg className="h-28 w-28 -rotate-90 transform">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="#3f3f50"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="oklch(0.72 0.16 185)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - percentage / 100)}
                  className="transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-primary">{daysElapsed} days</span>
                <span className="text-xs text-gray-500">On {daysTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
