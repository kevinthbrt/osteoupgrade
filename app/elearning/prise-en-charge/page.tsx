'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchProfilePayload } from '@/lib/profile-client'
import AuthLayout from '@/components/AuthLayout'
import { HeartPulse } from 'lucide-react'

export default function PriseEnChargePage() {
  const router = useRouter()

  useEffect(() => {
    fetchProfilePayload().then((payload) => {
      if (!payload?.user) { router.push('/'); return }
      if (payload.profile?.role !== 'admin') { router.push('/dashboard'); return }
    })
  }, [])

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">
        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-rose-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-red-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-rose-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <HeartPulse className="h-4 w-4" /> E-Learning
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-rose-100 to-red-200 bg-clip-text text-transparent">
                Prise en charge des pathologies
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Retrouvez ici tous les conseils de prise en charge par pathologie.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-red-300/50 to-transparent blur-sm" />
        </div>

        {/* ── Body ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          <div className="relative">
            <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-8 text-center text-slate-500">
              Contenu en préparation.
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
