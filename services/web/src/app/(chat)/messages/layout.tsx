
'use client'

import { AppShellProvider } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'
import { AppShell } from '@/components/ui/ComponentLogic/Appshell/Appshell'
import { ReactNode } from 'react'

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellProvider>
      <div data-theme="light-teal">
        <AppShell>
          {children}
        </AppShell>
      </div>
    </AppShellProvider>
  )
}