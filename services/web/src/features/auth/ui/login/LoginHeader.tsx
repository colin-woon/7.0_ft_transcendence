import { Layers } from 'lucide-react'

export function LoginHeader() {
  return (
    <div className="text-center space-y-2">
      <div className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center mx-auto shadow-sm border border-white/50 mb-4 text-indigo-600 animate-[fade-up_0.5s_0.1s_ease-out_both]">
        <Layers className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 animate-[fade-up_0.5s_0.15s_ease-out_both]">
        Welcome back
      </h1>
      <p className="text-sm text-slate-500 animate-[fade-up_0.5s_0.2s_ease-out_both]">
        Sign in securely with your Google account
      </p>
    </div>
  )
}