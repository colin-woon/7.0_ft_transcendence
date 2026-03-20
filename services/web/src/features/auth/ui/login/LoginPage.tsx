"use client"
import React from 'react'
import { Layers } from 'lucide-react'
import { useAuth } from '@/features/auth/models/AuthContext'
import LoginButton from "@/features/auth/ui/login/LoginButton";


export default function App() {
  const { login } = useAuth()

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-gray-100 p-4 sm:p-6 font-sans text-slate-800 overflow-hidden relative">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-[100px]" />

      <div className="w-full max-w-md relative animate-[fade-up_0.7s_ease-out_both]">
        {/* Glass Card */}
        <div className="relative backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 sm:p-10 overflow-hidden">
          {/* Shine */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

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

            {/* Google Login */}
            <LoginButton>
            </LoginButton>

            <p className="text-xs text-slate-500 text-center animate-[fade-up_0.5s_0.3s_ease-out_both]">
              We only support Google sign-in for now.
            </p>
            <p className="text-xs text-slate-500 text-center animate-[fade-up_0.5s_0.35s_ease-out_both]">
              New here? Your Google account will create a profile on first sign-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
