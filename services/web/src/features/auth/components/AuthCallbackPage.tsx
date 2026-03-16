'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    router.push('/')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Redirecting...
    </div>
  )
}
