'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  ArrowRight,
  Stethoscope,
  BookOpen,
  Wrench,
  Calendar,
  Award,
  TrendingUp,
  Users,
  Gift,
  Box,
  Zap,
  FileText,
  Clock,
  Video,
  Target,
  Brain,
  Sparkles,
  Trophy,
  Flame
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
              <a href="#modules" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Modules
              </a>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Tarifs
              </a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/auth')}
                className="text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-all text-sm"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="bg-sky-500 text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-sky-400 transition-all text-sm sm:text-base"
              >
                Essai gratuit
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="h-4 w-4" />
                Module épaule gratuit · 150+ vidéos pratiques · Topographie 3D
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                Structure ton raisonnement clinique
                <br />
                <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                  sans lâcher le contact patient
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
                L&apos;écosystème complet pour ostéopathes : <strong>tests orthopédiques structurés</strong>,
                <strong> 150+ vidéos de techniques</strong>, <strong>topographie 3D interactive</strong>,
                <strong> e-learning</strong> et <strong>séminaires présentiels</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <button
                  onClick={() => router.push('/auth')}
                  className="bg-sky-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-sky-400 transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-xl font-semibold hover:bg-slate-900 hover:text-white transition-all text-lg"
                >
                  Découvrir les modules
                </button>
              </div>

              <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Pas de carte bancaire pour l&apos;essai gratuit
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {[
              { label: 'Vidéos techniques', value: '150+' },
              { label: 'Tests orthopédiques', value: '100+' },
              { label: 'Exercices patients', value: '150+' },
              { label: 'Régions anatomiques', value: '10+' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'Structure ton raisonnement',
                description: 'OsteoUpgrade ne remplace pas ton expertise clinique. Il la structure, la trace et te fait gagner du temps sur ce qui est répétitif.'
              },
              {
                icon: Clock,
                title: 'Garde le contact patient',
                description: 'Pensé pour le cabinet, pas pour te distraire. Accès rapide aux outils essentiels pendant ta consultation.'
              },
              {
                icon: Target,
                title: 'Pensé pour le terrain',
                description: 'Jeune diplômé ou praticien installé : garder un raisonnement clinique solide avec des contenus directement applicables.'
              }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="text-center p-8 rounded-2xl hover:bg-slate-50 transition-all">
                  <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/30">
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

      {/* 4 Main Modules */}
      <section id="modules" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-sky-50 text-sky-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
              4 Modules
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Un écosystème complet pour ta pratique
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              De la consultation au perfectionnement : tout ce dont tu as besoin en un seul endroit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Module Pratique */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-transparent">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/30">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Module Pratique</h3>
                  <p className="text-slate-600">150+ vidéos de techniques ostéopathiques</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Techniques HVLA par région',
                  'Mobilisations articulaires',
                  'Techniques tissulaires et fasciales',
                  'Organisées par région anatomique',
                  'Vidéos HD avec explications détaillées'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Module E-Learning */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-transparent">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Module E-Learning</h3>
                  <p className="text-slate-600">Formation continue structurée</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Cours vidéo par formations et chapitres',
                  'Quiz de validation (100% requis)',
                  'Cas cliniques avec diagnostic différentiel',
                  'Fiches pathologies détaillées',
                  'Tests orthopédiques par région'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Module Outils */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-transparent">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Module Outils</h3>
                  <p className="text-slate-600">Supports pratiques pour tes patients</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  '150+ exercices thérapeutiques illustrés',
                  'Fiches patients personnalisables',
                  'Modèles de documents professionnels',
                  'Courriers, attestations, factures',
                  'Export PDF prêt à partager'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Module Séminaires */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-transparent relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                Premium Gold
              </div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Module Séminaires</h3>
                  <p className="text-slate-600">Formation présentielle exclusive</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  '1 séminaire présentiel (2 jours) par an',
                  'Inscription en ligne simplifiée',
                  'Rappels automatiques avant l\'événement',
                  'Pratique intensive en petit groupe',
                  'Networking avec d\'autres praticiens'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Section: 3D + Gamification */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-purple-50 text-purple-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Innovation
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Une expérience unique et engageante
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Topographie 3D */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border border-purple-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Box className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Topographie 3D Interactive</h3>
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                Guide diagnostique topographique avec <strong>modèle anatomique 3D interactif</strong>.
                Clique sur la zone douloureuse et obtiens un arbre décisionnel diagnostique structuré.
              </p>
              <ul className="space-y-3">
                {[
                  'Modèle 3D anatomique complet (Three.js)',
                  'Navigation intuitive par région',
                  'Arbres décisionnels par zone',
                  'Du symptôme au diagnostic différentiel',
                  'Tests recommandés selon la zone'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <Sparkles className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gamification */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Système de Gamification</h3>
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                Progresse et reste motivé avec un <strong>système de niveaux, badges et récompenses</strong>
                qui trackent ton engagement et ton évolution.
              </p>
              <ul className="space-y-3">
                {[
                  'Niveaux et XP basés sur ton activité',
                  'Badges et achievements thématiques',
                  'Streaks : suivi des connexions quotidiennes',
                  'Suivi de progression par module',
                  'Défis et objectifs personnalisés'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <Flame className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section détaillées */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-sky-50 text-sky-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Fonctionnalités
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Tout ce dont tu as besoin au cabinet
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: 'Tests Orthopédiques',
                description: 'Bibliothèque complète de tests structurés par région avec descriptions détaillées, indications et critères d\'interprétation.',
                color: 'sky'
              },
              {
                icon: Video,
                title: '150+ Vidéos Pratiques',
                description: 'Techniques HVLA, mobilisations et tissulaires. Démonstrations HD professionnelles pour chaque région anatomique.',
                color: 'rose'
              },
              {
                icon: Target,
                title: 'Fiches Diagnostiques',
                description: 'Dossiers pathologies complets avec photos, signes cliniques, tests associés et protocoles de prise en charge.',
                color: 'blue'
              },
              {
                icon: TrendingUp,
                title: '150+ Exercices Patients',
                description: 'Exercices thérapeutiques illustrés par région. Créez et exportez des fiches personnalisées en PDF.',
                color: 'orange'
              },
              {
                icon: BookOpen,
                title: 'Formations E-Learning',
                description: 'Cours vidéo structurés avec quiz de validation. Progressez à votre rythme avec un suivi de complétion.',
                color: 'purple'
              },
              {
                icon: Wrench,
                title: 'Documents Professionnels',
                description: 'Modèles de courriers, attestations, factures et documents administratifs prêts à personnaliser.',
                color: 'green'
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-slate-200">
                  <div className={`w-14 h-14 bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-sky-50 text-sky-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Tarifs
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Une formule pour chaque besoin
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Tous les abonnements sont annuels avec engagement par cycle de 12 mois
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Free */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:shadow-xl transition-all">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-bold text-slate-900">0€</span>
                  <span className="text-slate-600">/an</span>
                </div>
                <p className="text-slate-600">Pour découvrir la plateforme</p>
              </div>

              <ul className="space-y-3 mb-8 min-h-[320px]">
                {[
                  'Module épaule complet',
                  'Tests orthopédiques épaule',
                  'Vidéos pratiques épaule',
                  'Exercices patients épaule',
                  'Topographie 3D épaule',
                  'Arbres décisionnels épaule',
                  'Outils essentiels',
                  'Système de gamification'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push('/auth')}
                className="w-full border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-900 hover:text-white transition-all"
              >
                Commencer gratuitement
              </button>
            </div>

            {/* Plan Premium Silver */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 p-8 hover:shadow-xl transition-all relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Premium Silver</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold text-slate-900">29,99€</span>
                  <span className="text-slate-600">/an</span>
                </div>
                <p className="text-slate-600">Pour une pratique complète</p>
              </div>

              <ul className="space-y-3 mb-8 min-h-[320px]">
                {[
                  'Toutes les régions anatomiques',
                  'Tests orthopédiques complets',
                  '150+ vidéos de techniques',
                  'Topographie 3D complète',
                  'Tous les arbres décisionnels',
                  'E-learning : cours et quiz',
                  '150+ exercices patients',
                  'Module communication',
                  'Documents professionnels',
                  'Support prioritaire'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push('/auth')}
                className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all"
              >
                Choisir Silver
              </button>
            </div>

            {/* Plan Premium Gold */}
            <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl p-8 hover:shadow-2xl transition-all relative transform md:scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                🏆 Populaire
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Premium Gold</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold text-slate-900">49,99€</span>
                  <span className="text-slate-800">/an</span>
                </div>
                <p className="text-slate-800 font-medium">L&apos;expérience complète + présentiel</p>
              </div>

              <ul className="space-y-3 mb-8 min-h-[320px]">
                {[
                  'Tout ce qui est inclus dans Silver',
                  '1 séminaire présentiel (2j) / an',
                  'Valeur séminaire : 400€+',
                  'Formation intensive en petit groupe',
                  'Networking professionnel',
                  'Système de parrainage',
                  '10% de commission sur parrainages',
                  'Génération de revenu passif',
                  'Support premium dédié',
                  'Accès prioritaire nouveautés'
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-900">
                    <CheckCircle className="h-5 w-5 text-slate-900 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => router.push('/auth')}
                className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg"
              >
                Choisir Gold
              </button>
            </div>
          </div>

          {/* Note sous les cartes */}
          <div className="mt-12 text-center">
            <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
              <strong>Engagement annuel par cycles de 12 mois.</strong> Les abonnements se renouvellent automatiquement.
              Résiliable à tout moment avant la fin du cycle en cours.
            </p>
          </div>
        </div>
      </section>

      {/* Referral System Section (Gold) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Gift className="h-4 w-4" />
              Exclusif Premium Gold
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Système de Parrainage : Génère un revenu passif
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              En tant que membre Premium Gold, gagne <strong>10% de commission</strong> sur chaque abonnement annuel parrainé
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: Users,
                title: 'Code unique',
                description: 'Reçois ton code de parrainage personnalisé dès ton inscription Gold'
              },
              {
                icon: Gift,
                title: '10% de commission',
                description: 'Gagne 10% sur chaque abonnement annuel Silver ou Gold parrainé'
              },
              {
                icon: TrendingUp,
                title: 'Paiement simple',
                description: 'Upload ton RIB et demande tes paiements directement depuis ton dashboard'
              }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-amber-200">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Exemple de revenus potentiels</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700">5 parrainages Silver (29,99€)</span>
                    <span className="font-bold text-slate-900">14,99€</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700">3 parrainages Gold (49,99€)</span>
                    <span className="font-bold text-slate-900">14,99€</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <span className="font-bold text-white">Total annuel potentiel</span>
                    <span className="font-bold text-2xl text-white">29,98€+</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 text-center">
                <div className="text-6xl mb-4">💰</div>
                <p className="text-slate-600 max-w-xs">
                  Plus tu parraines, plus tu génères de revenus passifs tout en aidant d&apos;autres praticiens
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-sky-500/20 text-sky-400 px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Comment ça marche
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Simple, rapide, efficace
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              Une application pensée pour s&apos;intégrer naturellement dans ta pratique quotidienne
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: '01',
                title: 'Crée ton compte',
                description: 'Inscription gratuite en 30 secondes. Accès immédiat au module épaule complet sans carte bancaire.'
              },
              {
                number: '02',
                title: 'Explore les modules',
                description: 'Découvre les tests, vidéos pratiques, topographie 3D et outils. Teste en conditions réelles au cabinet.'
              },
              {
                number: '03',
                title: 'Upgrade quand tu veux',
                description: 'Passe Premium Silver (29,99€) ou Gold (49,99€) pour débloquer toutes les régions et fonctionnalités.'
              }
            ].map((step, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all">
                <div className="text-6xl font-bold text-sky-500 mb-4 opacity-80">{step.number}</div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-sky-500 via-blue-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Prêt à structurer ton raisonnement clinique ?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 leading-relaxed">
            Rejoins des centaines d&apos;ostéopathes qui utilisent déjà OsteoUpgrade au quotidien.
            Teste gratuitement le module épaule complet, sans engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={() => router.push('/auth')}
              className="bg-white text-sky-600 px-10 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all text-lg inline-flex items-center gap-2 shadow-2xl"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white text-white px-10 py-4 rounded-xl font-bold hover:bg-white hover:text-sky-600 transition-all text-lg"
            >
              Voir les tarifs
            </button>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-blue-100 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Pas de carte bancaire · Accès immédiat · Module épaule complet
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="text-2xl font-bold mb-4">
                Osteo<span className="text-sky-500">Upgrade</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                La plateforme qui structure ton raisonnement clinique sans lâcher le contact patient.
                Développée par des ostéopathes pour des ostéopathes.
              </p>
              <div className="flex gap-4">
                <Award className="h-10 w-10 text-sky-500" />
                <Users className="h-10 w-10 text-sky-500" />
                <Zap className="h-10 w-10 text-sky-500" />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Modules</h4>
              <ul className="space-y-3">
                <li><a href="#modules" className="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" /> Module Pratique
                </a></li>
                <li><a href="#modules" className="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Module E-Learning
                </a></li>
                <li><a href="#modules" className="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-2">
                  <Wrench className="h-4 w-4" /> Module Outils
                </a></li>
                <li><a href="#modules" className="text-slate-400 hover:text-sky-400 transition-colors flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Module Séminaires
                </a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Produit</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-slate-400 hover:text-sky-400 transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="text-slate-400 hover:text-sky-400 transition-colors">Tarifs</a></li>
                <li><a href="/auth" className="text-slate-400 hover:text-sky-400 transition-colors">Essai gratuit</a></li>
                <li><a href="/auth" className="text-slate-400 hover:text-sky-400 transition-colors">Se connecter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Légal</h4>
              <ul className="space-y-3">
                <li><a href="/cgu" className="text-slate-400 hover:text-sky-400 transition-colors">CGU</a></li>
                <li><a href="#" className="text-slate-400 hover:text-sky-400 transition-colors">Confidentialité</a></li>
                <li><a href="#" className="text-slate-400 hover:text-sky-400 transition-colors">Mentions légales</a></li>
                <li><a href="#" className="text-slate-400 hover:text-sky-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              © 2024 OsteoUpgrade. Tous droits réservés.
            </p>
            <p className="text-slate-500 text-sm">
              Made with ❤️ for osteopaths
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
