'use client'

import { useRouter } from 'next/navigation'
import { GraduationCap, FileQuestion, Target, BookOpen, ArrowRight } from 'lucide-react'

export default function LearningHubPage() {
  const router = useRouter()

  const modules = [
    {
      id: 'courses',
      title: 'Cours',
      description: 'Formations théoriques structurées par thématiques : anatomie, HVLA, mobilisation, biomécanique...',
      icon: BookOpen,
      href: '/elearning',
      gradient: 'from-blue-500 to-cyan-600',
      count: '50+ cours',
      features: ['Vidéos', 'Documents', 'Progression suivie']
    },
    {
      id: 'quizzes',
      title: 'Quiz',
      description: 'Testez vos connaissances avec des quiz interactifs et obtenez un feedback instantané.',
      icon: FileQuestion,
      href: '/encyclopedia/learning/quizzes',
      gradient: 'from-purple-500 to-indigo-600',
      count: 'Nouveauté',
      features: ['QCM', 'Vrai/Faux', 'Score et explications']
    },
    {
      id: 'cases',
      title: 'Cas Pratiques',
      description: 'Mettez en pratique vos compétences avec des cas cliniques interactifs progressifs.',
      icon: Target,
      href: '/encyclopedia/learning/cases',
      gradient: 'from-amber-500 to-orange-600',
      count: 'Nouveauté',
      features: ['Scénarios réels', 'Décisions cliniques', 'Feedback détaillé']
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Module E-Learning</h1>
            <p className="text-slate-600 mt-1">Approfondissez vos connaissances et validez vos acquis</p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <div
              key={module.id}
              className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-300 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

              {/* Count badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                  {module.count}
                </span>
              </div>

              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${module.gradient} mb-4 shadow-lg transform transition-transform group-hover:scale-110`}>
                <Icon className="h-7 w-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">{module.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{module.description}</p>

              {/* Features */}
              <ul className="space-y-1 mb-6">
                {module.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => router.push(module.href)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-semibold transition-all shadow-lg group-hover:shadow-xl"
              >
                <span>Explorer</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Info Section */}
      <div className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 border border-emerald-200">
        <h3 className="font-bold text-slate-900 mb-2">💡 Comment utiliser le module E-Learning ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">1️⃣</div>
            <h4 className="font-semibold text-slate-900 mb-1">Apprenez</h4>
            <p className="text-sm text-slate-600">Suivez les cours théoriques à votre rythme</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">2️⃣</div>
            <h4 className="font-semibold text-slate-900 mb-1">Testez-vous</h4>
            <p className="text-sm text-slate-600">Validez vos connaissances avec les quiz</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl mb-2">3️⃣</div>
            <h4 className="font-semibold text-slate-900 mb-1">Pratiquez</h4>
            <p className="text-sm text-slate-600">Mettez en application avec les cas pratiques</p>
          </div>
        </div>
      </div>
    </div>
  )
}
