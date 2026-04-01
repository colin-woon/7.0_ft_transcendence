export default function Bio() {
  return (
    <div className="flex items-center gap-3 w-full max-w-4xl">
      <p className="flex-1 text-[12px] text-base-content/60 font-light leading-relaxed">
        Building cool stuff, one commit at a time.
      </p>
      <button className="text-[10px] text-base-content/40 border border-base-300 rounded-[5px] px-2.5 py-1 hover:bg-base-200 transition-colors tracking-[0.02em]">
        edit
      </button>
    </div>
  );
}
