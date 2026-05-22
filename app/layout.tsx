import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Font Inter z obsługą polskich znaków (latin-ext)
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Anatomy Studio',
  description: 'Interaktywny eksplorator anatomii 3D dla studentów medycyny',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={inter.variable}>
      <body
        suppressHydrationWarning
        className={`${inter.className} h-full overflow-hidden bg-[#1a1a2e] antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
