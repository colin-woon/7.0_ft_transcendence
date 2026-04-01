import { AppShellProvider } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'
import { AppShell } from '@/components/ui/ComponentLogic/Appshell/Appshell'
import { AuthProvider } from '@/features/auth/models/AuthContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <body>
        <AuthProvider>
          <AppShellProvider>
            <AppShell>
              <div className='flex-col overflow-y-auto'>
                {children}
              </div>
            </AppShell>
          </AppShellProvider>
        </AuthProvider>
      </body>
  )
}