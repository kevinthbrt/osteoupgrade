'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Stethoscope,
  GraduationCap,
  Search,
  ArrowRight,
  Sparkles,
  FileText,
  Brain,
  Target
} from 'lucide-react'

export default function EncyclopediaPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const modules = [
    {
      id: 'practice',
      title: 'Module Pratique',
      description: 'Accédez à toutes les techniques ostéopathiques organisées par région anatomique. Vidéos détaillées, démonstrations et protocoles pratiques.',
      icon: Stethoscope,
      href: '/encyclopedia/practice',
      gradient: 'from-pink-500 via-pink-600 to-rose-600',
      stats: {
        label: 'Techniques disponibles',
        value: '150+'
      },
      features: [
        'Vidéos HD de techniques',
        'Protocoles détaillés',
        'Organisation par région',
        'HVLA, mobilisation, tissulaire'
      ]
    },
    {
      id: 'diagnostics',
      title: 'Module Diagnostic',
      description: 'Base de données complète des pathologies avec tests orthopédiques, signes cliniques et photos pour affiner votre diagnostic.',
      icon: BookOpen,
      href: '/encyclopedia/diagnostics',
      gradient: 'from-sky-500 via-sky-600 to-blue-600',
      stats: {
        label: 'Pathologies répertoriées',
        value: '200+'
      },
      features: [
        'Tests orthopédiques',
        'Signes cliniques',
        'Photos de référence',
        'Drapeaux rouges'
      ]
    },
    {
      id: 'learning',
      title: 'Module E-Learning',
      description: 'Cours théoriques, quiz interactifs et cas pratiques pour approfondir vos connaissances et valider vos acquis.',
      icon: GraduationCap,
      href: '/encyclopedia/learning',
      gradient: 'from-emerald-500 via-emerald-600 to-teal-600',
      stats: {
        label: 'Cours et quiz',
        value: '50+'
      },
      features: [
        'Cours structurés',
        'Quiz de validation',
        'Cas pratiques interactifs',
        'Progression suivie'
      ]
    }
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/encyclopedia/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl mb-8">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative px-6 py-10 md:px-10 md:py-12">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              <span className="text-xs font-semibold text-sky-100">
                Encyclopédie Ostéopathique
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-sky-100">
              Votre encyclopédie interactive
            </h1>

            <p className="text-lg text-slate-300 mb-8 max-w-2xl">
              Accédez à toutes vos ressources ostéopathiques en un seul endroit.
              Techniques pratiques, diagnostics, cours théoriques et évaluations interactives.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une technique, pathologie, cours..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold transition-all shadow-lg"
              >
                Rechercher
              </button>
            </form>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">150+</div>
                <div className="text-xs text-slate-300">Techniques</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">200+</div>
                <div className="text-xs text-slate-300">Diagnostics</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-xs text-slate-300">Cours & Quiz</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Modules de l'encyclopédie
            </h2>
            <p className="text-slate-600 text-sm">
              Explorez nos 3 modules complémentaires pour une approche complète
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon

            return (
              <div
                key={module.id}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-transparent hover:border-sky-200 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} mb-4 shadow-lg transform transition-transform group-hover:scale-110`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {module.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {module.description}
                </p>

                {/* Stats */}
                <div className="bg-slate-50 rounded-lg p-3 mb-4">
                  <div className="text-2xl font-bold text-slate-900">{module.stats.value}</div>
                  <div className="text-xs text-slate-600">{module.stats.label}</div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <Target className="h-3 w-3 text-sky-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() => router.push(module.href)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-semibold transition-all shadow-lg group-hover:shadow-xl"
                >
                  <span>Explorer le module</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Features Overview */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8 border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Fonctionnalités de l'encyclopédie
            </h3>
            <p className="text-slate-600 mb-4">
              Une approche intégrée pour optimiser votre apprentissage et votre pratique clinique.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-indigo-100">
                <div className="font-semibold text-slate-900 mb-1">🔗 Interconnexions</div>
                <p className="text-xs text-slate-600">
                  Les modules sont liés entre eux : d'un diagnostic, accédez aux techniques et cours associés
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-indigo-100">
                <div className="font-semibold text-slate-900 mb-1">📊 Progression suivie</div>
                <p className="text-xs text-slate-600">
                  Votre progression est sauvegardée avec statistiques et badges à débloquer
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-indigo-100">
                <div className="font-semibold text-slate-900 mb-1">🎓 Validation des acquis</div>
                <p className="text-xs text-slate-600">
                  Quiz et cas pratiques pour tester vos connaissances et compétences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
