'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

export default function ForumRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{children}</>
  }

  const key = pathname ?? 'forum-route'
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.5, ease: 'easeOut' as const }

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={key}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 1 }}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
