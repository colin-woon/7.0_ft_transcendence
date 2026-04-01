interface Project {
  name: string;
  pct: number;
  color: string;
}

export default function Projects({ projects }: { projects: Project[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {projects.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] border border-base-300 bg-base-200"
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="flex-1 text-[11px] font-medium text-base-content">{p.name}</span>
          <span className="font-mono text-[9px] text-base-content/40">{p.pct}%</span>
        </div>
      ))}
    </div>
  );
}
