'use client'

import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import {
  Dumbbell,
  TestTube,
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
      id: 'testing',
      title: 'Testing 3D',
      description: 'Module 3D interactif pour explorer l’anatomie et réaliser les tests orthopédiques',
      icon: TestTube,
      href: '/testing',
      gradient: 'from-purple-500 to-indigo-600',
      count: '3D',
      available: true
    },
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
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <Wrench className="h-3.5 w-3.5 text-orange-300" />
                <span className="text-xs font-semibold text-orange-100">Outils Pratiques</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-100">
                Outils du Praticien
              </h1>

              <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl">
                Exercices thérapeutiques, protocoles personnalisés et outils pratiques pour optimiser votre prise en charge.
              </p>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">150+</div>
                  <div className="text-xs text-slate-300">Exercices</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">4</div>
                  <div className="text-xs text-slate-300">Outils</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Outils Grid */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Outils Disponibles</h2>
              <p className="text-sm text-slate-600">Ressources pratiques pour votre activité quotidienne</p>
            </div>
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
                  className={`group relative overflow-hidden rounded-2xl bg-white border-2 p-6 text-left shadow-lg transition-all duration-300 ${
                    isDisabled
                      ? 'border-slate-200 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 hover:border-orange-300 hover:shadow-2xl hover:-translate-y-1'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${outil.gradient} opacity-0 ${!isDisabled && 'group-hover:opacity-5'} transition-opacity`} />

                  <div className="relative">
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
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-white to-red-50 p-6 border border-orange-100">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-2">💪 Module Exercices</h3>
              <p className="text-slate-600 mb-4">
                Accédez à une bibliothèque complète d'exercices thérapeutiques organisés par région anatomique.
                Chaque exercice comprend des instructions détaillées et peut être prescrit à vos patients.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="font-semibold text-slate-900 mb-1">📋 150+ exercices</div>
                  <p className="text-xs text-slate-600">Organisés par région</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="font-semibold text-slate-900 mb-1">🎯 Niveaux progressifs</div>
                  <p className="text-xs text-slate-600">Débutant à avancé</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="font-semibold text-slate-900 mb-1">💡 Instructions claires</div>
                  <p className="text-xs text-slate-600">Faciles à prescrire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
