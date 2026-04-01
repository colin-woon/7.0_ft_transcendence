interface Achievement {
  icon: string;
  name: string;
  sub: string;
}

export default function Achievements({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="flex flex-col divide-y divide-base-300">
      {achievements.map((a) => (
        <div key={a.name} className="flex items-center gap-2.5 py-1.5 first:pt-0 last:pb-0">
          <div className="w-6 h-6 rounded-[6px] bg-base-200 flex items-center justify-center flex-shrink-0 text-xs">
            {a.icon}
          </div>
          <div>
            <p className="text-[11px] font-medium text-base-content">{a.name}</p>
            <p className="text-[9px] text-base-content/40 font-light mt-px">{a.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
