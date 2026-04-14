import { ChevronRight, ExternalLink } from 'lucide-react'

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-base-content mt-7 mb-1">{children}</h2>
}

export function SettingRow({
  title,
  subtitle,
  value,
  external,
  right,
  onClick,
}: {
  title: string
  subtitle?: string
  value?: string
  external?: boolean
  right?: React.ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-4 border-b border-base-200 gap-4 ${onClick ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-base-content">{title}</p>
        {subtitle && <p className="text-xs text-base-content/50 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {value && <span className="text-sm text-base-content/50">{value}</span>}
        {right}
        {external ? (
          <ExternalLink size={15} className="text-base-content/30" />
        ) : (
          !right && <ChevronRight size={16} className="text-base-content/30" />
        )}
      </div>
    </div>
  )
}

export function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  return <input type="checkbox" className="toggle toggle-sm" defaultChecked={defaultChecked} />
}

export function ConnectButton({ connected }: { connected?: boolean }) {
  return (
    <button className={`btn btn-sm rounded-full font-semibold ${connected ? 'btn-outline border-base-300' : 'btn-neutral'}`}>
      {connected ? 'Disconnect' : 'Connect'}
    </button>
  )
}
