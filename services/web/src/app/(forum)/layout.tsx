'use client'

import { AppShellProvider } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'
import { AppShell } from '@/components/ui/ComponentLogic/Appshell/Appshell'
import { ReactNode } from 'react'
import ForumRouteTransition from './ForumRouteTransition'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellProvider>
      <AppShell>
        <ForumRouteTransition>{children}</ForumRouteTransition>
      </AppShell>
    </AppShellProvider>
  )
}