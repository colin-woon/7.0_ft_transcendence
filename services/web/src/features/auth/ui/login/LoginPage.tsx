"use client"
import { useAuth } from '@/features/auth/models/AuthContext'
import LoginButton from "@/features/auth/ui/login/LoginButton"
import { BackgroundBlobs } from "@/features/auth/ui/login/BackgroundBlobs"
import { GlassCard } from "@/features/auth/ui/login/GlassCard"
import { LoginHeader } from "@/features/auth/ui/login/LoginHeader"
import { LoginFooterText } from "@/features/auth/ui/login/LoginFooterText"


export default function App() {
  const { login } = useAuth()

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-white p-8 sm:p-12 font-sans text-slate-800 overflow-hidden relative">
      <BackgroundBlobs />

      <div className="w-full max-w-md relative animate-[fade-up_0.7s_ease-out_both]">
        <GlassCard>
          <div className="flex flex-col items-center space-y-8">
            {/* Header */}
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

            {/* Login Buttons */}
            <LoginButton />

            <p className="text-xs text-slate-500 text-center animate-[fade-up_0.5s_0.4s_ease-out_both]">
              Sign in with your Google account or 42 (Intra) school account.
            </p>
            <p className="text-xs text-slate-500 text-center animate-[fade-up_0.5s_0.35s_ease-out_both]">
              New here? Your Google account will create a profile on first sign-in.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
