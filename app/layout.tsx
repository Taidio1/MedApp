import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'

// Font Inter z obsługą polskich znaków (latin-ext)
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'MedApp Anatomy Studio',
  description: 'Interaktywny eksplorator anatomii 3D dla studentów medycyny',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pl" className={`${inter.variable} ${manrope.variable}`}>
      <body
        suppressHydrationWarning
        className={`${inter.className} min-h-full bg-[#f2ecdf] antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
