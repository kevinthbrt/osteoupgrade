import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OsteoUpgrade - Aide au raisonnement pour ostéopathes',
  description: 'Plateforme professionnelle d\'aide au raisonnement avec tests orthopédiques',
  icons: {
    icon: '/osteoupgrade-logo.svg',
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
        {children}
      </body>
    </html>
  )
}
