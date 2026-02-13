// import LoginForm from './LoginForm.tsx';
// import styles from './login.module.css'

"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Layers } from 'lucide-react'
export default function App() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-gray-100 p-4 font-sans text-slate-800 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-[100px]" />

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.8,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full max-w-md relative"
      >
        {/* Glass Card */}
        <div className="relative backdrop-blur-xl bg-white/30 border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-8 sm:p-10 overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

          <div className="flex flex-col items-center space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  delay: 0.2,
                  duration: 0.5,
                }}
                className="w-12 h-12 bg-white/50 rounded-xl flex items-center justify-center mx-auto shadow-sm border border-white/50 mb-4 text-indigo-600"
              >
                <Layers className="w-6 h-6" />
              </motion.div>
              <motion.h1
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.3,
                }}
                className="text-2xl font-semibold tracking-tight text-slate-900"
              >
                Welcome back
              </motion.h1>
              <motion.p
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                transition={{
                  delay: 0.4,
                }}
                className="text-sm text-slate-500"
              >
                Enter your details to access your account
              </motion.p>
            </div>

            {/* Social Login */}
            <motion.button
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.5,
              }}
              whileHover={{
                scale: 1.01,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
              }}
              whileTap={{
                scale: 0.98,
              }}
              className="w-full flex items-center justify-center gap-3 bg-white/60 hover:bg-white/80 border border-white/60 text-slate-700 py-2.5 px-4 rounded-xl transition-colors duration-200 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </motion.button>

            {/* Divider */}
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.6,
              }}
              className="w-full flex items-center gap-4"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-50" />
              <span className="text-xs text-slate-400 font-medium">OR</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent opacity-50" />
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.7,
              }}
              className="w-full space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="space-y-4">
                <div className="group relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full bg-white/40 border border-white/60 focus:border-indigo-300/50 focus:ring-4 focus:ring-indigo-100/50 rounded-xl py-2.5 pl-10 pr-4 outline-none text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 shadow-sm hover:bg-white/60"
                  />
                </div>
                <div className="group relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full bg-white/40 border border-white/60 focus:border-indigo-300/50 focus:ring-4 focus:ring-indigo-100/50 rounded-xl py-2.5 pl-10 pr-4 outline-none text-sm text-slate-700 placeholder:text-slate-400 transition-all duration-200 shadow-sm hover:bg-white/60"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-500 hover:text-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <motion.button
                whileHover={{
                  scale: 1.01,
                }}
                whileTap={{
                  scale: 0.99,
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-slate-900/20 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>Sign in</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.form>

            {/* Footer */}
            <motion.p
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 0.8,
              }}
              className="text-xs text-slate-500 text-center"
            >
              Don't have an account?{' '}
              <a
                href="#"
                className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                Sign up
              </a>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
