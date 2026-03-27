
import { useAuth } from '@/features/auth/models/AuthContext'

export default function LoginButtons() {
  const { login } = useAuth()
  
  return (
    <div className="w-full space-y-3">
      {/* Google Login Button */}
      <button
        onClick={() => login('google')}
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

      {/* 42 (Intra) Login Button */}
      <button
        onClick={() => login('42')}
        className="w-full flex items-center justify-center gap-3 bg-blue-100/60 hover:bg-blue-100/80 active:scale-[0.98] border border-blue-200/60 text-blue-700 py-2.5 px-4 rounded-xl transition-all duration-150 shadow-sm animate-[fade-up_0.5s_0.3s_ease-out_both]"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
        <span className="text-sm font-medium">Continue with 42</span>
      </button>
    </div>
  )
}