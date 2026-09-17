import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'AI App Builder — Minimal Prompt → Maximal App',
  description: 'Ketik sedikit, jadi aplikasi. Platform pembuat aplikasi otomatis berbasis AI (Next.js).',
  icons: { icon: '/favicon.svg' }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  )
}
