"use client"

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface HoursChartProps {
  data: { week: string; hours: number }[]
}

export function HoursChart({ data }: HoursChartProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3a3a4a] via-[#2d2d3a] to-[#252532] p-6 shadow-xl ring-1 ring-white/10">
      {/* Glossy highlight */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
      {/* Subtle inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">Elapsed time</h3>
        </div>

        <div className="mb-2 flex items-end gap-4">
          <div className="flex items-baseline gap-2 text-gray-400">
            <span className="text-xs">60h</span>
          </div>
        </div>

        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(value) => `${value}h`}
                width={30}
                domain={[0, 60]}
                ticks={[0, 15, 30, 45, 60]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f1f2e",
                  border: "1px solid #3f3f50",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#9ca3af" }}
                itemStyle={{ color: "#14b8a6" }}
                formatter={(value: number) => [`${value}h`, "Hours"]}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#14b8a6"
                strokeWidth={2}
                fill="url(#hoursGradient)"
                dot={{ fill: "#14b8a6", strokeWidth: 0, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
