'use client'

import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import {
  FileText,
  Wrench,
  ArrowRight
} from 'lucide-react'

export default function OutilsPage() {
  const router = useRouter()

  const outils = [
    {
      id: 'communication',
      title: 'Communication',
      description: 'Modèles de courriers, attestations et documents professionnels à télécharger',
      icon: FileText,
      href: '/outils/communication',
      gradient: 'from-blue-500 to-cyan-600',
      count: 'Premium',
      available: true
    }
  ]

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          {/* Animated blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

          <div className="relative">
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Outils Pratiques
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                Outils du Praticien
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Documents professionnels, modèles de courriers et outils de communication pour votre cabinet.
              </p>
            </div>
          </div>

          {/* Bottom glow lines */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent blur-sm" />
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          {/* Animated background blobs */}
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/35 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-8">

            {/* Outils Grid */}
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Outils Disponibles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outils.map((outil) => {
                  const Icon = outil.icon
                  const isDisabled = !outil.available

                  return (
                    <button
                      key={outil.id}
                      onClick={() => {
                        if (outil.available) {
                          router.push(outil.href)
                        }
                      }}
                      disabled={isDisabled}
                      className={`group rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-5 text-left transition-all duration-200 ${
                        isDisabled
                          ? 'opacity-60 cursor-not-allowed'
                          : 'hover:bg-white/95 hover:shadow-2xl hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${outil.gradient} shadow-lg ${!isDisabled && 'transform transition-transform group-hover:scale-110'}`}>
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          outil.available ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {outil.count}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-2">{outil.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4">{outil.description}</p>

                      <div className={`flex items-center gap-2 transition-colors ${
                        isDisabled ? 'text-slate-400' : 'text-slate-400 group-hover:text-orange-600'
                      }`}>
                        <span className="text-sm font-semibold">
                          {isDisabled ? 'Prochainement' : 'Explorer'}
                        </span>
                        {!isDisabled && (
                          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
