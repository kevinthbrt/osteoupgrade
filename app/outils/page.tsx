'use client'

import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import {
  Dumbbell,
  FileText,
  Wrench,
  ArrowRight,
  Sparkles,
  Settings
} from 'lucide-react'

export default function OutilsPage() {
  const router = useRouter()

  const outils = [
    {
      id: 'exercices',
      title: 'Exercices Thérapeutiques',
      description: 'Bibliothèque complète d\'exercices organisés par région anatomique pour vos patients',
      icon: Dumbbell,
      href: '/exercices',
      gradient: 'from-orange-500 to-red-600',
      count: '150+ exercices',
      available: true
    },
    {
      id: 'communication',
      title: 'Communication',
      description: 'Modèles de courriers, attestations et documents professionnels à télécharger',
      icon: FileText,
      href: '/outils/communication',
      gradient: 'from-blue-500 to-cyan-600',
      count: 'Premium',
      available: true
    },
    {
      id: 'protocoles',
      title: 'Générateur de Protocoles',
      description: 'Créez des protocoles de traitement personnalisés en combinant techniques et exercices',
      icon: FileText,
      href: '/outils/protocoles',
      gradient: 'from-purple-500 to-indigo-600',
      count: 'Bientôt',
      available: false
    },
    {
      id: 'autres',
      title: 'Autres Outils',
      description: 'Fiches d\'anamnèse, planificateurs, et outils pratiques à venir',
      icon: Wrench,
      href: '/outils/autres',
      gradient: 'from-sky-500 to-blue-600',
      count: 'À venir',
      available: false
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
            <div className="bg-white/5 backdrop-blur-md border border-white/10 ring-1 ring-inset ring-white/8 rounded-3xl p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Outils Pratiques
              </p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                Outils du Praticien
              </h1>
              <p className="text-blue-300/70 text-sm mt-1.5">
                Exercices thérapeutiques, protocoles personnalisés et outils pratiques pour optimiser votre prise en charge.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 max-w-md mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">150+</div>
                  <div className="text-xs text-blue-300/70">Exercices</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">4</div>
                  <div className="text-xs text-blue-300/70">Outils</div>
                </div>
              </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Info Section */}
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-blue-500 to-blue-700" />
                <h2 className="text-sm font-bold text-slate-800 tracking-wide">Module Exercices</h2>
              </div>

              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-600 mb-4">
                      Accédez à une bibliothèque complète d'exercices thérapeutiques organisés par région anatomique.
                      Chaque exercice comprend des instructions détaillées et peut être prescrit à vos patients.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-xl bg-white/70 border border-white/60 p-3">
                        <div className="font-semibold text-slate-900 mb-1">150+ exercices</div>
                        <p className="text-xs text-slate-600">Organisés par région</p>
                      </div>
                      <div className="rounded-xl bg-white/70 border border-white/60 p-3">
                        <div className="font-semibold text-slate-900 mb-1">Niveaux progressifs</div>
                        <p className="text-xs text-slate-600">Débutant à avancé</p>
                      </div>
                      <div className="rounded-xl bg-white/70 border border-white/60 p-3">
                        <div className="font-semibold text-slate-900 mb-1">Instructions claires</div>
                        <p className="text-xs text-slate-600">Faciles à prescrire</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

      </div>
    </AuthLayout>
  )
}
