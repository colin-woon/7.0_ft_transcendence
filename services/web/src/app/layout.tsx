import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/models/AuthContext';
import { ChatStoreProvider } from '@/features/chat/models';
import { AppShellProvider } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext';
import { AppShell } from '@/components/ui/ComponentLogic/Appshell/Appshell';

export const metadata: Metadata = {
	title: '42 Overflow',
	description: 'A Q&A platform for 42 projects',
  icons: {
    icon: '/assets/meta-42overflow.png',
    shortcut: '/assets/meta-42overflow.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="emerald">
      <body>
        <AuthProvider>
          <ChatStoreProvider>
            <AppShellProvider>
              <AppShell>
                {children}
              </AppShell>
            </AppShellProvider>
          </ChatStoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}