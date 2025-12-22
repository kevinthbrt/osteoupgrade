'use client'

import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import {
  BookOpen,
  FileQuestion,
  Target,
  TestTube as TestTubeIcon,
  Stethoscope,
  Map,
  GraduationCap,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export default function ElearningHubPage() {
  const router = useRouter()

  const learningModules = [
    {
      id: 'cours',
      title: 'Cours',
      description: 'Formations structurées par thématiques : HVLA, mobilisation, anatomie, biomécanique et plus',
      icon: BookOpen,
      href: '/elearning/cours',
      gradient: 'from-blue-500 to-cyan-600',
      count: '50+ cours',
      category: 'Apprentissage'
    },
    {
      id: 'quizzes',
      title: 'Quiz',
      description: 'Testez vos connaissances avec des quiz interactifs et obtenez un feedback instantané',
      icon: FileQuestion,
      href: '/encyclopedia/learning/quizzes',
      gradient: 'from-purple-500 to-indigo-600',
      count: 'Nouveauté',
      category: 'Apprentissage'
    },
    {
      id: 'cases',
      title: 'Cas Pratiques',
      description: 'Scénarios cliniques interactifs pour mettre en pratique vos compétences de raisonnement',
      icon: Target,
      href: '/encyclopedia/learning/cases',
      gradient: 'from-amber-500 to-orange-600',
      count: 'Nouveauté',
      category: 'Apprentissage'
    },
    {
      id: 'tests',
      title: 'Tests Orthopédiques',
      description: 'Base de données complète des tests orthopédiques organisés par région avec vidéos',
      icon: TestTubeIcon,
      href: '/tests',
      gradient: 'from-emerald-500 to-teal-600',
      count: '200+ tests',
      category: 'Référence Clinique'
    },
    {
      id: 'diagnostics',
      title: 'Diagnostics & Pathologies',
      description: 'Pathologies par région avec photos, signes cliniques, red flags et tests associés',
      icon: Stethoscope,
      href: '/diagnostics',
      gradient: 'from-rose-500 to-pink-600',
      count: '150+ pathologies',
      category: 'Référence Clinique'
    },
    {
      id: 'topographie',
      title: 'Topographie',
      description: 'Guides topographiques pour structurer votre raisonnement clinique région par région',
      icon: Map,
      href: '/topographie',
      gradient: 'from-sky-500 to-blue-600',
      count: '15+ guides',
      category: 'Référence Clinique'
    }
  ]

  // Group by category
  const apprentissage = learningModules.filter(m => m.category === 'Apprentissage')
  const reference = learningModules.filter(m => m.category === 'Référence Clinique')

  return (
    <AuthLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <GraduationCap className="h-3.5 w-3.5 text-blue-300" />
                <span className="text-xs font-semibold text-blue-100">E-Learning</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                Contenu Théorique & Éducatif
              </h1>

              <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl">
                Accédez à tout le contenu théorique et clinique : cours, quiz, cas pratiques, tests orthopédiques, diagnostics et guides topographiques.
              </p>

              <div className="grid grid-cols-3 gap-4 max-w-lg">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">500+</div>
                  <div className="text-xs text-slate-300">Contenus</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">6</div>
                  <div className="text-xs text-slate-300">Modules</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="text-2xl font-bold text-white">∞</div>
                  <div className="text-xs text-slate-300">Possibilités</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apprentissage Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Apprentissage</h2>
              <p className="text-sm text-slate-600">Développez vos connaissances et compétences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {apprentissage.map((module) => {
              const Icon = module.icon

              return (
                <button
                  key={module.id}
                  onClick={() => router.push(module.href)}
                  className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-blue-300 p-6 text-left shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} shadow-lg transform transition-transform group-hover:scale-110`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {module.count}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{module.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{module.description}</p>

                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                      <span className="text-sm font-semibold">Explorer</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Référence Clinique Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <TestTubeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Référence Clinique</h2>
              <p className="text-sm text-slate-600">Guides, tests et diagnostics pour votre pratique</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reference.map((module) => {
              const Icon = module.icon

              return (
                <button
                  key={module.id}
                  onClick={() => router.push(module.href)}
                  className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-300 p-6 text-left shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} shadow-lg transform transition-transform group-hover:scale-110`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        {module.count}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">{module.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{module.description}</p>

                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-600 transition-colors">
                      <span className="text-sm font-semibold">Explorer</span>
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 border border-indigo-100">
          <h3 className="font-bold text-slate-900 mb-2">💡 Comment utiliser le module E-Learning ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Apprenez</h4>
              <p className="text-sm text-slate-600">Suivez les cours et consultez les références cliniques</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Testez-vous</h4>
              <p className="text-sm text-slate-600">Validez vos connaissances avec les quiz</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-semibold text-slate-900 mb-1">Pratiquez</h4>
              <p className="text-sm text-slate-600">Appliquez vos acquis avec les cas pratiques</p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
