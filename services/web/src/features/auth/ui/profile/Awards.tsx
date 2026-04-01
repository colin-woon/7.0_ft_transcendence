interface Award {
  icon: string;
  name: string;
  from: string;
  bg: string;
}

export default function Awards({ awards }: { awards: Award[] }) {
  return (
    <div className="flex flex-col divide-y divide-base-300">
      {awards.map((a) => (
        <div key={a.name} className="flex items-center gap-2.5 py-1.5 first:pt-0 last:pb-0">
          <div
            className="w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0 text-sm"
            style={{ background: a.bg }}
          >
            {a.icon}
          </div>
          <div>
            <p className="text-[11px] font-medium text-base-content">{a.name}</p>
            <p className="text-[9px] text-base-content/40 font-light mt-px">{a.from}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
