import { NextResponse } from 'next/server'
import { TUTORIALS, TUTORIAL_CATEGORIES } from '@/lib/tutorials'

/**
 * Catalogue des tutoriels, lu par MyOsteoflow pour sa section « Tutoriels ».
 * Publier un tutoriel ici le rend visible dans l'application sans nouvelle
 * version. Les adresses sont absolues : l'application ne connaît pas le site.
 *
 * Contrat (version 1) : ne retirer ni renommer aucun champ sans mettre à jour
 * `src/lib/tutorials/catalog.ts` côté MyOsteoflow, qui ignore ce qu'il ne
 * comprend pas.
 */

export const dynamic = 'force-static'

const SITE = 'https://www.osteo-upgrade.fr'

export function GET() {
  const tutorials = TUTORIALS.map((t) => ({
    slug: t.slug,
    category: t.category,
    addedAt: t.addedAt,
    kicker: t.kicker,
    title: t.title,
    summary: t.summary,
    intro: t.intro,
    duration: t.duration,
    availability: t.availability,
    page: `${SITE}/tutoriels/${t.slug}`,
    video: `${SITE}/tutoriels/videos/${t.slug}.mp4`,
    poster: `${SITE}/tutoriels/videos/${t.slug}.webp`,
    steps: t.steps.map((step, index) => ({
      title: step.title,
      text: step.text,
      image: `${SITE}/tutoriels/${t.slug}/etape-${index + 1}.webp`,
    })),
    faq: t.faq,
  }))

  const used = new Set(tutorials.map((t) => t.category))
  return NextResponse.json(
    {
      version: 1,
      categories: TUTORIAL_CATEGORIES.filter((c) => used.has(c.id)),
      tutorials,
    },
    { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300, s-maxage=3600' } }
  )
}
