import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import BetaBanner from '@/components/BetaBanner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['italic', 'normal'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: 'OsteoUpgrade × MyOsteoflow — Gérez votre cabinet, élevez votre pratique',
  description: 'La plateforme tout-en-un des ostéopathes, étiopathes et chiropracteurs : MyOsteoflow pour gérer votre cabinet (dictée IA, suivi patient, compta) et OsteoUpgrade pour faire progresser votre pratique (tests, EBP, e-learning).',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <BetaBanner />
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
