import type { Metadata } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = {
  title: 'Brain — Cognitive Operating System',
  description: 'A modular agent operating system with markdown-based memory and flow-state orchestration.',
  icons: {
    icon: '/favicon.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
