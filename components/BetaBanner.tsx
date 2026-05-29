'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export default function BetaBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="w-full bg-amber-400 text-slate-900 py-2 px-4 flex items-center gap-3 text-sm font-medium z-[60] relative">
      <div className="flex-1 text-center">
        <span className="font-bold">Bêta</span> — La plateforme est en phase de test active. Des améliorations arrivent régulièrement.
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="hover:opacity-60 transition-opacity p-0.5 shrink-0"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
