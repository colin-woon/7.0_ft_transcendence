import { AppShellProvider } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'
import { AppShell } from '@/components/ui/ComponentLogic/Appshell/Appshell'
import { AuthProvider } from '@/features/auth/models/AuthContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <AppShellProvider>
            <AppShell>
              {children}
            </AppShell>
          </AppShellProvider>
        </AuthProvider>
      </body>
    </html>
  )
}