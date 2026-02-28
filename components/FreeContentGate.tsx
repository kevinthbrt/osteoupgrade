'use client'

import { Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface FreeContentGateProps {
  isLocked: boolean
  children: React.ReactNode
  className?: string
  /** Show a compact lock badge instead of a full overlay */
  compact?: boolean
}

/**
 * Wraps content that is locked for free users.
 * When locked: blurs the content and shows a lock overlay.
 * When unlocked: renders children normally.
 */
export default function FreeContentGate({
  isLocked,
  children,
  className = '',
  compact = false,
}: FreeContentGateProps) {
  if (!isLocked) return <div className={className}>{children}</div>

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Blurred content */}
      <div className="blur-[3px] pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] z-10 rounded-xl">
        {compact ? (
          <div className="flex items-center gap-1.5 rounded-full bg-gray-800/80 px-3 py-1.5 text-xs font-semibold text-white shadow">
            <Lock className="h-3 w-3" />
            Premium
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 shadow-lg">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Contenu Premium</p>
            <Link
              href="/settings/subscription"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors shadow"
            >
              <Sparkles className="h-3 w-3" />
              Débloquer
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
