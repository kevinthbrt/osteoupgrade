import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import BetaBanner from '@/components/BetaBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OsteoUpgrade - Aide au raisonnement pour ostéopathes',
  description: 'Plateforme professionnelle d\'aide au raisonnement avec tests orthopédiques',
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
    <html lang="fr">
      <body className={inter.className}>
        <BetaBanner />
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
