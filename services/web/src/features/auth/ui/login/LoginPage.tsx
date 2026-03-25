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
            <LoginHeader />
            <LoginButton />
            <LoginFooterText />
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
