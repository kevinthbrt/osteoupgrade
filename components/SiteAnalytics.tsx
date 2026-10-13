'use client'

import { Analytics } from '@vercel/analytics/react'

// L'appli patient (/programme) porte le programme d'exercices dans le
// fragment de l'URL : aucune mesure d'audience n'y est envoyée, et partout
// ailleurs le fragment est retiré par précaution.
export default function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url)
        if (url.pathname.startsWith('/programme')) return null
        url.hash = ''
        return { ...event, url: url.toString() }
      }}
    />
  )
}
