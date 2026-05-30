'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function AdminBackButton({ light }: { light?: boolean }) {
  return (
    <Link
      href="/admin"
      className={
        light
          ? 'inline-flex items-center gap-1.5 px-3 py-1.5 mb-5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm hover:bg-slate-200 hover:text-slate-900 transition-all'
          : 'inline-flex items-center gap-1.5 px-3 py-1.5 mb-5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white/70 text-sm hover:bg-white/20 hover:text-white transition-all'
      }
    >
      <ChevronLeft className="h-4 w-4" />
      Dashboard Admin
    </Link>
  )
}
