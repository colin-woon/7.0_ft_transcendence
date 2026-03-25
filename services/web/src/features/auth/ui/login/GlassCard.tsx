interface GlassCardProps {
  children: React.ReactNode
}

export function GlassCard({ children }: GlassCardProps) {
  return (
    <div className="relative backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 sm:p-10 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      {children}
    </div>
  )
}