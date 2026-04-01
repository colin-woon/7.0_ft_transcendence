export default function ProfileHeader() {
  return (
    <div className="flex items-center gap-4 w-full max-w-4xl">
      <div className="relative flex-shrink-0">
        <div className="avatar">
          <div className="w-14 h-14 rounded-full ring-1 ring-base-300">
            <img
              src="https://img.daisyui.com/images/profile/demo/yellingcat@192.webp"
              alt="avatar"
            />
          </div>
        </div>
        <span className="absolute -bottom-0.5 -right-1.5 bg-[#085041] text-[#9FE1CB] font-mono text-[8px] font-bold px-1.5 py-0.5 rounded-[5px] border-2 border-base-100 tracking-[0.03em]">
          LVL 7
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[13px] font-bold text-base-content">ItsHotCoCoa</p>
        <p className="text-[10px] text-base-content/40 font-light mt-0.5 tracking-[0.01em]">
          cadet &nbsp;·&nbsp; active 2h ago
        </p>
        <div className="flex gap-[18px] mt-2.5">
          {[
            { v: "2.4k", l: "Followers" },
            { v: "318",  l: "Following" },
            { v: "156",  l: "Posts"     },
            { v: "8.7k", l: "Karma"     },
          ].map((s) => (
            <div key={s.l} className="flex flex-col gap-px">
              <span className="font-mono text-[12px] font-bold text-base-content">{s.v}</span>
              <span className="text-[9px] uppercase tracking-[0.08em] text-base-content/40">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
