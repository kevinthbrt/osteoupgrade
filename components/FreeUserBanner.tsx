'use client'

import { Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

/**
 * Banner shown at the top of pages for free users,
 * explaining what content is accessible and offering an upgrade path.
 */
export default function FreeUserBanner({ plan = 'free' }: { plan?: string }) {
  // Un abonné MyOsteoFlow n'est pas un compte gratuit : ce qui lui manque,
  // c'est OsteoUpgrade, et le message doit le dire.
  const estAbonneOsteoflow = plan === 'osteoflow'

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <Lock className="h-4 w-4 flex-shrink-0 text-amber-600" />
      <p className="flex-1 text-amber-800">
        {estAbonneOsteoflow ? (
          <>
            <span className="font-semibold">Offre MyOsteoFlow</span> — Ce contenu fait partie
            d&apos;<span className="font-semibold">OsteoUpgrade</span>. Ajoutez-le à votre
            abonnement pour y accéder.
          </>
        ) : (
          <>
            <span className="font-semibold">Accès gratuit</span> — Seule la catégorie{' '}
            <span className="font-semibold">Épaule</span> et les contenus libres sont accessibles.
            Les autres contenus sont inclus avec{' '}
            <span className="font-semibold">OsteoUpgrade</span>.
          </>
        )}
      </p>
      <Link
        href="/settings/subscription"
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow-sm whitespace-nowrap"
      >
        <Sparkles className="h-3 w-3" />
        {estAbonneOsteoflow ? 'Ajouter OsteoUpgrade' : 'Voir les offres'}
      </Link>
    </div>
  )
}
