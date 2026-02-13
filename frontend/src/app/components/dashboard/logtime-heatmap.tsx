"use client"

interface LogtimeData {
  month: string
  year: number
  days: { day: number; active: boolean; intensity: number }[]
}

interface LogtimeHeatmapProps {
  data: LogtimeData[]
}

function getMonthDays(month: string, year: number): number {
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  return new Date(year, monthMap[month] + 1, 0).getDate()
}

function getFirstDayOfMonth(month: string, year: number): number {
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }
  return new Date(year, monthMap[month], 1).getDay()
}

export function LogtimeHeatmap({ data }: LogtimeHeatmapProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-6 text-sm font-bold uppercase tracking-wide text-gray-900">Logtime</h3>

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {data.map((monthData) => {
          const totalDays = getMonthDays(monthData.month, monthData.year)
          const firstDay = getFirstDayOfMonth(monthData.month, monthData.year)
          const weeks: (number | null)[][] = []
          let currentWeek: (number | null)[] = Array(firstDay).fill(null)

          for (let day = 1; day <= totalDays; day++) {
            currentWeek.push(day)
            if (currentWeek.length === 7) {
              weeks.push(currentWeek)
              currentWeek = []
            }
          }
          if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
              currentWeek.push(null)
            }
            weeks.push(currentWeek)
          }

          return (
            <div key={`${monthData.month}-${monthData.year}`}>
              <h4 className="mb-3 text-center text-xs font-semibold text-gray-700">{monthData.month}</h4>
              <div className="space-y-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex justify-center gap-1">
                    {week.map((day, dayIndex) => {
                      if (day === null) {
                        return <div key={dayIndex} className="h-5 w-5" />
                      }
                      
                      const dayData = monthData.days.find((d) => d.day === day)
                      const isActive = dayData?.active ?? false
                      const intensity = dayData?.intensity ?? 0

                      return (
                        <div
                          key={dayIndex}
                          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium transition-colors ${
                            isActive
                              ? intensity > 0.7
                                ? "bg-primary text-white"
                                : intensity > 0.3
                                ? "bg-primary/60 text-white"
                                : "bg-primary/30 text-gray-700"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                          title={isActive ? `${day} ${monthData.month}: Active` : `${day} ${monthData.month}`}
                        >
                          {day}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
