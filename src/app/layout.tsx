import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GreenGive — Golf. Give. Win.',
  description: 'Subscribe, enter your golf scores, win monthly prizes, and support charities you love.',
  keywords: ['golf', 'charity', 'subscription', 'prize draw', 'stableford'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-dark-900 text-white font-body antialiased">
        {children}
      </body>
    </html>
  )
}
