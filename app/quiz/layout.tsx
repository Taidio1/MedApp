import { Libre_Baskerville } from 'next/font/google'
import type { ReactNode } from 'react'

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
  display: 'swap',
})

export default function QuizLayout({ children }: { children: ReactNode }) {
  return (
    <div className={libreBaskerville.variable} style={{ fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
      {children}
    </div>
  )
}
