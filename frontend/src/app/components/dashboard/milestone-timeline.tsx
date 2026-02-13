"use client"

import { Check } from "lucide-react"

interface Milestone {
  id: number
  name: string
  completed: boolean
  months: string[]
}

interface MilestoneTimelineProps {
  milestones: Milestone[]
  currentMilestone: number
  eta: string
}

export function MilestoneTimeline({ milestones, currentMilestone, eta }: MilestoneTimelineProps) {
  const allMonths = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"]

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#252532] via-[#1a1a24] to-[#151520] p-6 shadow-xl ring-1 ring-white/5">
      {/* Glossy highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />
      
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Common Core ETA:</span>
          <p className="text-2xl font-bold text-primary">{eta}</p>
        </div>
      </div>

      {/* Month labels */}
      <div className="mb-2 flex">
        <div className="w-32 shrink-0" />
        <div className="flex flex-1 justify-between overflow-hidden">
          {allMonths.map((month, i) => (
            <span key={`${month}-${i}`} className="w-12 text-center text-[10px] text-gray-500">
              {month}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative flex items-center">
        <div className="w-32 shrink-0" />
        <div className="relative h-12 flex-1">
          {/* Background track */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-gray-700" />
          
          {/* Milestones */}
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center">
            {milestones.map((milestone, index) => {
              const width = 100 / milestones.length

              return (
                <div
                  key={milestone.id}
                  className="relative flex items-center"
                  style={{ width: `${width}%` }}
                >
                  {/* Checkmark */}
                  {milestone.completed && (
                    <div className="absolute -left-3 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-[#1a1a24]" />
                    </div>
                  )}

                  {/* Milestone bar */}
                  <div
                    className={`mx-1 h-9 flex-1 rounded ${
                      milestone.completed
                        ? "bg-primary"
                        : milestone.id === currentMilestone
                        ? "bg-primary/50"
                        : "bg-gray-700"
                    }`}
                  >
                    <div className="flex h-full items-center justify-center px-2">
                      <span className={`text-xs font-medium whitespace-nowrap ${
                        milestone.completed ? "text-[#1a1a24]" : "text-gray-500"
                      }`}>
                        {milestone.completed && <Check className="mr-1 inline h-3 w-3" />}
                        {milestone.name}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Current position marker */}
          <div
            className="absolute top-full h-10 w-0.5 bg-red-500"
            style={{ left: `${(currentMilestone / milestones.length) * 100}%` }}
          >
            <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-red-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
