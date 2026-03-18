import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CscmsProvider } from '@/components/cscms-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'CSCMS - Construction Safety & Compliance Management',
  description: 'Real-time construction safety monitoring, compliance tracking, and workforce management system.',
}

export const viewport: Viewport = {
  themeColor: '#2C3E50',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <CscmsProvider>
          {children}
          <Analytics />
        </CscmsProvider>
      </body>
    </html>
  )
}
