import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['italic', 'normal'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
})

const baseUrl = 'https://www.osteo-upgrade.fr'

export const metadata: Metadata = {
  title: 'OsteoUpgrade × MyOsteoflow — Gérez votre cabinet, élevez votre pratique',
  description: 'La plateforme tout-en-un des ostéopathes, étiopathes et chiropracteurs : MyOsteoflow pour gérer votre cabinet (dictée IA, suivi patient, compta) et OsteoUpgrade pour faire progresser votre pratique (tests, EBP, e-learning).',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    url: baseUrl,
    siteName: 'OsteoUpgrade',
    title: 'OsteoUpgrade × MyOsteoflow — Gérez votre cabinet, élevez votre pratique',
    description: 'La plateforme tout-en-un des ostéopathes, étiopathes et chiropracteurs : MyOsteoflow pour gérer votre cabinet (dictée IA, suivi patient, compta) et OsteoUpgrade pour faire progresser votre pratique (tests, EBP, e-learning).',
    images: [
      {
        url: `${baseUrl}/landing/screenshots/hero.png`,
        width: 1200,
        height: 630,
        alt: 'OsteoUpgrade — Plateforme pour ostéopathes',
      },
    ],
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OsteoUpgrade × MyOsteoflow — Gérez votre cabinet, élevez votre pratique',
    description: 'La plateforme tout-en-un des ostéopathes, étiopathes et chiropracteurs.',
    images: [`${baseUrl}/landing/screenshots/hero.png`],
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
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
