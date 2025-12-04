'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  ArrowRight,
  Cube,
  FileText,
  Download,
  MapPin,
  Clock,
  Zap,
  BookOpen
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-xl sm:text-2xl font-bold text-slate-900">
              Osteo<span className="text-sky-500">Upgrade</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Fonctionnalités
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Comment ça marche
              </a>
              <a href="#premium" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Premium
              </a>
            </div>
            <button
              onClick={() => router.push('/auth')}
              className="bg-sky-500 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-sky-400 transition-all text-sm sm:text-base"
            >
              Tester gratuitement
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <CheckCircle className="h-4 w-4" />
                Maintenant disponible : Module épaule complet
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Structure ton raisonnement clinique
                <br />
                <span className="text-sky-500">sans lâcher le contact patient</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
                Module 3D des tests orthopédiques par région, guide diagnostique topographique, 
                exports de sessions de testing et accès à un écosystème de formations pensé pour les thérapeutes manuels.
                <strong> Tout ce dont tu as besoin au cabinet.</strong>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/auth')}
                  className="bg-sky-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-sky-400 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  Tester gratuitement avec l'épaule
                </button>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-lg font-semibold hover:bg-slate-900 hover:text-white transition-all text-lg"
                >
                  Voir comment ça marche
                </button>
              </div>
            </div>

            {/* Screenshot Placeholder */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
                <div className="aspect-[16/10] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white border-2 border-dashed border-slate-300 p-8">
                  <Cube className="h-16 w-16 text-sky-500 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Capture principale interface</h3>
                  <p className="text-sm text-slate-600 text-center">Vue d'ensemble de l'application avec le module 3D épaule</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: 'Structure ton raisonnement',
                description: 'OsteoUpgrade ne remplace pas ton raisonnement clinique. Il le structure, le trace et te fait gagner du temps sur tout ce qui est répétitif.'
              },
              {
                icon: Clock,
                title: 'Garde le contact patient',
                description: 'Pour que tu restes concentré sur le patient. Pas besoin de changer tout ton cabinet, l\'app se branche sur ce que tu fais déjà.'
              },
              {
                icon: Zap,
                title: 'Pensé pour le terrain',
                description: 'Que tu sois jeune diplômé ou praticien installé depuis 15 ans, l\'objectif est le même : garder un raisonnement clinique solide.'
              }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-sky-50 text-sky-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Fonctionnalités
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Tout ce dont tu as besoin au cabinet
            </h2>
          </div>

          {/* Feature 1: 3D Tests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">Tests orthopédiques en 3D</h3>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Visualise chaque test sur un modèle 3D interactif. Rotation, zoom et angles multiples 
                pour comprendre parfaitement le positionnement et l'exécution.
              </p>
              <ul className="space-y-4">
                {[
                  'Modèles anatomiques haute qualité par région',
                  'Descriptions détaillées de chaque test',
                  'Critères d'interprétation clairs',
                  'Rotation 360° et zoom précis'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-700">
                    <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <div className="aspect-[16/10] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white border-2 border-dashed border-slate-300 p-8">
                <Cube className="h-16 w-16 text-sky-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Module 3D tests</h3>
                <p className="text-sm text-slate-600 text-center">Capture du module 3D avec un test orthopédique affiché</p>
              </div>
            </div>
          </div>

          {/* Feature 2: Decision Trees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <div className="aspect-[16/10] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white border-2 border-dashed border-slate-300 p-8">
                <MapPin className="h-16 w-16 text-sky-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Arbre décisionnel</h3>
                <p className="text-sm text-slate-600 text-center">Capture d'un arbre de décision diagnostique en cours</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl font-bold text-slate-900 mb-6">Guide diagnostique complet</h3>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Bientôt : un guide diagnostique complet qui partira de la symptomatologie pour 
                établir un diagnostic via un modèle d'arbre décisionnel.
              </p>
              <ul className="space-y-4">
                {[
                  'Arbre décisionnel structuré par région',
                  'Du symptôme au diagnostic différentiel',
                  'Orientation vers les tests pertinents',
                  'Protocoles validés scientifiquement'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-700">
                    <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Export */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-6">Export de sessions de testing</h3>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Trace ton raisonnement et exporte tes sessions de testing. Intègre facilement 
                dans ton logiciel de gestion ou tes notes de consultation.
              </p>
              <ul className="space-y-4">
                {[
                  'Historique complet de tes consultations',
                  'Export PDF ou texte formaté',
                  'Intégration avec tes outils existants',
                  'Traçabilité de ton raisonnement clinique'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-slate-700">
                    <div className="w-6 h-6 bg-sky-500 rounded flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <div className="aspect-[16/10] flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white border-2 border-dashed border-slate-300 p-8">
                <Download className="h-16 w-16 text-sky-500 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Export de session</h3>
                <p className="text-sm text-slate-600 text-center">Capture d'une session de testing avec option d'export</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-sky-500/20 text-sky-400 px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Comment ça marche
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Tu l'ouvres, tu testes, tu traces. C'est tout.
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Une application pensée pour le cabinet, pas pour remplacer ton raisonnement mais pour le structurer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: '01',
                title: 'Sélectionne la région',
                description: 'Choisis la zone anatomique qui correspond à la plainte de ton patient. Module épaule actuellement disponible.'
              },
              {
                number: '02',
                title: 'Réalise les tests',
                description: 'Visualise les tests en 3D, lis les descriptions et note les résultats au fur et à mesure de ta consultation.'
              },
              {
                number: '03',
                title: 'Exporte et trace',
                description: 'Exporte ta session de testing pour l\'intégrer dans ton logiciel de gestion ou tes notes de consultation.'
              }
            ].map((step, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
                <div className="text-5xl font-bold text-sky-500 mb-4 opacity-80">{step.number}</div>
                <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section id="premium" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border-2 border-sky-500 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-sky-400"></div>
            
            <div className="text-center mb-8">
              <div className="inline-block bg-sky-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Premium
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Bien plus qu'une app : un écosystème de formation
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                L'abonnement premium ouvre l'accès à la plateforme complète et à un socle de contenus 
                pour faire évoluer ta pratique chaque année.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                'Accès complet au module épaule : tests 3D, descriptions et exports',
                'Guide diagnostique complet avec arbre décisionnel (à venir)',
                'Nouveaux modules anatomiques ajoutés régulièrement',
                'Contenus de formation pour faire évoluer ta pratique',
                'Export illimité de sessions de testing',
                'Support prioritaire et mises à jour'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-50 p-4 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-sky-500 flex-shrink-0" />
                  <span className="text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => router.push('/auth')}
                className="bg-sky-500 text-white px-10 py-4 rounded-lg font-semibold hover:bg-sky-400 transition-all text-lg inline-flex items-center gap-2"
              >
                Commencer avec l'essai gratuit
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Prêt à structurer ton raisonnement clinique ?
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-8">
            Teste gratuitement le module épaule et découvre comment OsteoUpgrade 
            s'intègre naturellement dans ta pratique quotidienne.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="bg-sky-500 text-white px-10 py-4 rounded-lg font-semibold hover:bg-sky-400 transition-all text-lg inline-flex items-center gap-2"
          >
            Tester gratuitement avec l'épaule
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="mt-8 bg-sky-500/10 border border-sky-500/30 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-white/90">
              <strong className="text-white">Permet de voir exactement comment fonctionne l'application au cabinet.</strong>
              <br />
              Pas besoin de carte bancaire pour l'essai gratuit.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-slate-900 mb-4">
                Osteo<span className="text-sky-500">Upgrade</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                La plateforme qui structure ton raisonnement clinique sans lâcher le contact patient. 
                Développée par des ostéopathes pour des ostéopathes.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Produit</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-slate-600 hover:text-sky-500 transition-colors">Fonctionnalités</a></li>
                <li><a href="#how-it-works" className="text-slate-600 hover:text-sky-500 transition-colors">Comment ça marche</a></li>
                <li><a href="#premium" className="text-slate-600 hover:text-sky-500 transition-colors">Premium</a></li>
                <li><a href="/auth" className="text-slate-600 hover:text-sky-500 transition-colors">Essai gratuit</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Ressources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-600 hover:text-sky-500 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-slate-600 hover:text-sky-500 transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-600 hover:text-sky-500 transition-colors">Formations</a></li>
                <li><a href="#" className="text-slate-600 hover:text-sky-500 transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Légal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-600 hover:text-sky-500 transition-colors">Mentions légales</a></li>
                <li><a href="#" className="text-slate-600 hover:text-sky-500 transition-colors">Confidentialité</a></li>
                <li><a href="#" className="text-slate-600 hover:text-sky-500 transition-colors">CGU</a></li>
                <li><a href="#" className="text-slate-600 hover:text-sky-500 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center text-slate-600 text-sm">
            © 2024 OsteoUpgrade. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
