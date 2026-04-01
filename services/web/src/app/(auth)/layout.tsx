import { AppShellProvider } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'
import { AppShell } from '@/components/ui/ComponentLogic/Appshell/Appshell'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShellProvider>
      <AppShell>
        {children}
      </AppShell>
    </AppShellProvider>
  )
}