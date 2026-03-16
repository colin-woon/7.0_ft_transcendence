import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Test Frontend - mTLS SSR',
	description: 'Testing Next.js SSR with mTLS in Docker',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				suppressHydrationWarning
			>
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	);
}
