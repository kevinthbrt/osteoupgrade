import type { Metadata, Viewport } from 'next'
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from 'next/font/google'

const body = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--pa-body' })
const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '700'], variable: '--pa-display' })

export const metadata: Metadata = {
  title: 'Mon programme d’exercices',
  description: 'Votre programme d’exercices, préparé par votre praticien.',
  robots: { index: false, follow: false },
  manifest: '/programme/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Mes exercices', statusBarStyle: 'default' },
  icons: { icon: '/programme/icon-192.png', apple: '/programme/icon-192.png' },
  // Le fragment de l'URL contient le programme : ne jamais le transmettre.
  referrer: 'no-referrer',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f8f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1a17' },
  ],
}

export default function ProgrammeLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${body.variable} ${display.variable}`}>{children}</div>
}
