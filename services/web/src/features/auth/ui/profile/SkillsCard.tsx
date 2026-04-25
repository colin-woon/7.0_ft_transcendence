import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function SkillsCard({ skills }: { skills: { name: string; level: number }[] }) {
  const hasData = skills && skills.length > 0;

  return (
    <div className="card bg-base-100 shadow-md rounded-xl p-4 flex flex-col md:flex-row items-center gap-5 w-full">
      <div className="w-full">
        <h2 className="text-lg font-bold text-slate-900">Skill Graph</h2>
        
        {hasData && (
          <div className="w-full h-[250px] mt-3 flex items-center justify-center overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skills}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }} 
                />
                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 'auto']} />
                <Radar
                  name="Level"
                  dataKey="level"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.5}
                  dot={{ r: 3, fill: "#06b6d4" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}