"use client"
import React from 'react'
import { Layers } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function App() {
  const { mockLogin } = useAuth()
  const router = useRouter()

  const handleGoogleLogin = () => {
    mockLogin()
    router.push('/home')
  }

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
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white/60 hover:bg-white/80 active:scale-[0.98] border border-white/60 text-slate-700 py-2.5 px-4 rounded-xl transition-all duration-150 shadow-sm animate-[fade-up_0.5s_0.25s_ease-out_both]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </button>

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
