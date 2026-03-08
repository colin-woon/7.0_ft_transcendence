import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Test Frontend - mTLS SSR",
  description: "Testing Next.js SSR with mTLS in Docker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
