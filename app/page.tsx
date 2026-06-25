/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import PublicFooter from '@/components/PublicFooter'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  ArrowRight,
  GraduationCap,
  TestTube2,
  Map,
  Play,
  Shield,
  Sparkles,
  Brain,
  ChevronRight,
  Menu,
  X,
  Crown,
  BookOpen,
  Gift,
  Users,
  Wallet,
  Target,
  Monitor,
  Video,
  MessageSquare,
  TrendingUp,
  Mic,
  FileText,
  Send,
  Lock,
  Receipt,
  BarChart3,
  Clock,
  Activity,
  Quote,
  Volume2,
  VolumeX,
} from 'lucide-react'

// Hook for scroll-triggered animations
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

// Animated counter component
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// Brand lockup — "OsteoUpgrade × MyOsteoflow"
function BrandLockup({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <span>
        Osteo<span className="text-sky-500">Upgrade</span>
      </span>
      <span className="text-slate-900 font-normal">×</span>
      <span className="font-display italic flow-text font-bold">MyOsteoflow</span>
    </span>
  )
}

function HeroVideo() {
  return (
    <div className="aspect-[14/9] w-full">
      <iframe
        src="https://player.vimeo.com/video/1204554379?title=0&byline=0&portrait=0"
        allow="autoplay; fullscreen; picture-in-picture"
        className="w-full h-full"
        style={{ border: 0 }}
      />
    </div>
  )
}

// Placeholder slot for the user's own photos / videos (easy to swap later)
function MediaSlot({
  label,
  hint,
  aspect = 'aspect-video',
  icon: Icon = Video,
  dark = false,
  className = '',
}: {
  label: string
  hint?: string
  aspect?: string
  icon?: React.ComponentType<{ className?: string }>
  dark?: boolean
  className?: string
}) {
  return (
    <div
      className={`relative ${aspect} w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center text-center px-6 border-2 border-dashed ${
        dark
          ? 'border-white/15 bg-gradient-to-br from-white/[0.04] to-white/[0.01]'
          : 'border-slate-300/80 bg-gradient-to-br from-slate-100 to-slate-50'
      } ${className}`}
    >
      <div
        className={`flex items-center justify-center w-14 h-14 rounded-2xl mb-4 flow-gradient shadow-lg ${
          dark ? 'shadow-blue-500/30' : 'shadow-blue-500/20'
        }`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <p className={`text-sm font-semibold ${dark ? 'text-white/80' : 'text-slate-700'}`}>{label}</p>
      {hint && <p className={`text-xs mt-1 max-w-xs ${dark ? 'text-white/40' : 'text-slate-400'}`}>{hint}</p>}
      <span
        className={`absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
          dark ? 'bg-white/10 text-white/50' : 'bg-white text-slate-400 border border-slate-200'
        }`}
      >
        Visuel à venir
      </span>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  const stats = useScrollReveal()
  const pains = useScrollReveal()
  const pillars = useScrollReveal()
  const flow = useScrollReveal()
  const upgrade = useScrollReveal()
  const pricing = useScrollReveal()
  const cta = useScrollReveal()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const navItems = [
    { label: 'Le quotidien', id: 'quotidien' },
    { label: 'MyOsteoflow', id: 'myosteoflow' },
    { label: 'OsteoUpgrade', id: 'osteoupgrade' },
    { label: 'Tarifs', id: 'pricing' },
  ]

  // Daily pain points of the practitioner (osteo / etio / chiro)
  const painPoints = [
    {
      quote: 'Je passe mes soirées sur la paperasse, les factures et la compta.',
      pillar: 'MyOsteoflow',
      pillarColor: 'flow',
      solution: 'Factures, paiements et compta automatisés',
      icon: Wallet,
      image: '/landing/compta.png',
    },
    {
      quote: 'Je prends mes notes pendant la séance, au détriment du patient.',
      pillar: 'MyOsteoflow',
      pillarColor: 'flow',
      solution: 'Dictée vocale : l’IA rédige pour vous',
      icon: Mic,
      image: '/landing/notes.png',
    },
    {
      quote: "Mes patients ne reviennent pas et je n'ai aucun suivi.",
      pillar: 'MyOsteoflow',
      pillarColor: 'flow',
      solution: 'Suivi automatique 7 jours après la séance',
      icon: Activity,
      image: '/landing/suivi.png',
    },
    {
      quote: 'Un doute sur le bon test ou le diagnostic différentiel.',
      pillar: 'OsteoUpgrade',
      pillarColor: 'sky',
      solution: '200+ tests et aide au raisonnement clinique',
      icon: TestTube2,
      image: '/landing/tests.png',
    },
    {
      quote: "Je n'arrive pas à suivre la littérature scientifique.",
      pillar: 'OsteoUpgrade',
      pillarColor: 'sky',
      solution: "Revue d'études EBP synthétisée chaque mois",
      icon: GraduationCap,
      image: '/landing/ebp.png',
    },
    {
      quote: 'Je manque de techniques concrètes et à jour.',
      pillar: 'OsteoUpgrade',
      pillarColor: 'sky',
      solution: '150+ techniques en vidéo, par région',
      icon: Play,
      image: '/landing/techniques.png',
    },
  ]

  // MyOsteoflow secondary features (after the AI dictation hero feature)
  const flowFeatures = [
    {
      icon: Activity,
      title: 'Suivi patient automatisé',
      desc: "Un email envoyé automatiquement 7 jours après la séance. Mesurez l'évolution de la douleur (EVA), la mobilité et la satisfaction, sans y penser.",
      badge: 'Innovation',
    },
    {
      icon: Send,
      title: 'Courriers générés par IA',
      desc: "Courrier d'adressage à un confrère ou attestation de consultation, rédigés par l'IA à partir du dossier, en quelques secondes.",
      badge: 'Innovation',
    },
    {
      icon: MessageSquare,
      title: 'Messagerie patients',
      desc: "Échangez avec vos patients depuis l'application, avec modèles de réponses, pièces jointes et historique par dossier.",
    },
    {
      icon: Target,
      title: "Objectifs & chiffre d'affaires",
      desc: 'Fixez vos objectifs annuels de CA et suivez votre progression jour, semaine, mois. Vos cibles converties en nombre de consultations.',
    },
    {
      icon: Receipt,
      title: 'Comptabilité & factures',
      desc: 'Factures PDF, paiements multiples ou fractionnés, exports CSV/Excel. Une compta prête à transmettre à votre comptable.',
    },
    {
      icon: BarChart3,
      title: 'Statistiques du cabinet',
      desc: "Démographie patients, motifs de consultation, jours de pointe, sources d'adressage. Pilotez votre activité d'un coup d'œil.",
    },
    {
      icon: Users,
      title: 'Dossiers patients complets',
      desc: 'Antécédents, anamnèse, historique de soins, topographie de la douleur. Tout le dossier, avec recherche instantanée.',
    },
    {
      icon: Brain,
      title: "Assistance au raisonnement clinique",
      desc: "En cas de doute clinique, l'IA suggère les tests orthopédiques les plus pertinents selon le tableau clinique. Votre raisonnement reste au centre, l'IA vous appuie.",
      badge: "Innovation",
    },
    {
      icon: Lock,
      title: "100% local & RGPD",
      desc: "Vos données restent sur votre machine, sans cloud imposé. Export et suppression RGPD en un clic, journal d'audit complet.",
    },
  ]

  // OsteoUpgrade interactive feature explorer
  const upgradeFeatures = [
    {
      icon: TestTube2,
      title: 'Tests orthopédiques',
      painPoint: 'Un doute sur un test à utiliser ?',
      desc: 'Notre bibliothèque de 200+ tests orthopédiques classés par région anatomique, avec sensibilité, spécificité, vidéos démonstratives et indication clinique. Trouvez le bon test en quelques secondes.',
      gradient: 'from-blue-500 to-cyan-500',
      screenshot: '/landing/screenshots/tests.png',
      glow: '14, 165, 233',
      tags: ['200+ tests', 'Sensi / Spéci', 'Vidéos démo', 'Par région'],
    },
    {
      icon: Map,
      title: 'Topographie clinique',
      painPoint: "Un doute sur la douleur d'un patient ?",
      desc: "Notre bibliothèque topographique région par région : repérez les structures susceptibles d'être impliquées et orientez votre bilan clinique.",
      gradient: 'from-sky-500 to-indigo-500',
      screenshot: '/landing/screenshots/topographie.png',
      glow: '99, 102, 241',
      tags: ['Par région', 'Structures', 'Repères cliniques'],
    },
    {
      icon: GraduationCap,
      title: 'Cours & E-Learning',
      painPoint: 'Vous voulez vous former en continu ?',
      desc: 'Cours structurés et quiz interactifs pour monter en compétence à votre rythme, depuis le fauteuil ou entre deux patients.',
      gradient: 'from-violet-500 to-purple-500',
      screenshot: '/landing/screenshots/elearning.png',
      glow: '139, 92, 246',
      tags: ['Cours structurés', 'Quiz', 'À votre rythme'],
    },
    {
      icon: FileText,
      title: "Revue de littérature",
      painPoint: "Perdu dans la masse d'études scientifiques ?",
      desc: "Chaque mois, la Revue OsteoUpgrade passe en revue et synthétise les meilleures études EBP, prêtes à appliquer en cabinet.",
      gradient: "from-emerald-500 to-teal-500",
      screenshot: "/landing/screenshots/revue.png",
      glow: '16, 185, 129',
      tags: ['EBP mensuel', 'Synthèses', 'Applicable'],
    },
    {
      icon: Play,
      title: 'Techniques en vidéo',
      painPoint: 'Vous manquez de techniques ?',
      desc: 'Notre catalogue de techniques de thérapie manuelle (HVLA, mobilisation, tissulaire) organisées par région anatomique, avec démonstrations vidéo détaillées.',
      gradient: 'from-orange-500 to-red-500',
      screenshot: '/landing/screenshots/videos.png',
      glow: '249, 115, 22',
      tags: ['Par région', 'HVLA', 'Mobilisation', 'Tissulaire'],
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-x-hidden">

      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <BrandLockup className="text-base sm:text-lg" />

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/auth')}
                className="hidden sm:inline-flex text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="flow-gradient text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-sm hover:shadow-md"
              >
                Essai gratuit
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -mr-2"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); router.push('/auth') }}
              className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Se connecter
            </button>
          </div>
        )}
      </nav>

      {/* ─── HERO — DEUX PILIERS ─── */}
      <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b19] via-[#0c1226] to-[#0f132a]" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Ambient glow — blue (MyOsteoflow) + violet to signal the two pillars */}
        <div className="absolute top-10 left-1/4 w-[520px] h-[520px] rounded-full bg-[#4169F6]/[0.10] blur-[130px]" />
        <div className="absolute bottom-0 right-1/4 w-[440px] h-[440px] rounded-full bg-violet-500/[0.08] blur-[110px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-slate-200 px-4 py-2 rounded-full text-xs font-semibold mb-8 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                Pour les ostéopathes, étiopathes & chiropracteurs
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] font-bold text-white leading-[1.05] mb-6 tracking-tight">
                Gérez votre cabinet.
                <br />
                <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Élevez votre pratique.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
                Deux outils, un seul abonnement.
                <span className="text-slate-200 font-medium font-display italic"> MyOsteoflow</span> fluidifie votre cabinet au quotidien.
                <span className="text-slate-200 font-medium"> OsteoUpgrade</span> fait progresser votre clinique. Pensés ensemble, pour vous rendre du temps et de la confiance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-9">
                <button
                  onClick={() => router.push('/auth')}
                  className="group flow-gradient text-white px-7 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => scrollTo('pillars')}
                  className="text-white/70 border border-white/15 px-7 py-4 rounded-xl font-semibold text-base hover:bg-white/5 hover:text-white hover:border-white/25 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  Découvrir les deux outils
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Sans carte bancaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-500" />
                  <span>Données 100% locales</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Module épaule offert</span>
                </div>
              </div>
            </div>

            {/* Right: Hero media slot (browser/app frame) */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="relative w-full max-w-xl mx-auto">
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 bg-[#0c1222]">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0e1a] border-b border-white/5">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="px-4 py-1 rounded-md bg-white/5 text-[10px] text-white/40 font-mono">
                        osteo-upgrade.fr
                      </div>
                    </div>
                  </div>
                  {/* Hero video */}
                  <HeroVideo />
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 px-3 py-1.5 rounded-xl flow-gradient text-white text-[10px] font-bold shadow-lg shadow-blue-500/30 animate-float">
                  Dictée IA
                </div>
                <div className="absolute -bottom-3 -left-4 px-3 py-1.5 rounded-xl bg-sky-500 text-white text-[10px] font-bold shadow-lg shadow-sky-500/30 animate-float-delayed">
                  200+ tests
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section ref={stats.ref} className="relative -mt-8 z-10 px-4 sm:px-6 lg:px-8 mb-20">
        <div className={`max-w-5xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8 transition-all duration-700 ${
          stats.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 200, suffix: '+', label: 'Tests orthopédiques', icon: TestTube2, numeric: true },
              { value: 500, suffix: '+', label: 'Contenus e-learning', icon: BookOpen, numeric: true },
              { text: 'IA', label: 'Notes dictées à la voix', icon: Mic, numeric: false },
              { text: '100%', label: 'Données chez vous', icon: Lock, numeric: false },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 mb-3">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">
                    {stat.numeric
                      ? <AnimatedCounter target={stat.value as number} suffix={stat.suffix} />
                      : stat.text}
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── LE QUOTIDIEN / PAIN POINTS ─── */}
      <section id="quotidien" ref={pains.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center mb-14 transition-all duration-700 ${
            pains.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              Votre quotidien
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Vous vous reconnaissez ?
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Les vraies frictions d&apos;une vie de praticien. Pour chacune, on a construit une réponse concrète.
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 transition-all duration-700 delay-200 ${
            pains.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {painPoints.map((pain) => {
              const Icon = pain.icon
              const isFlow = pain.pillarColor === 'flow'
              return (
                <div
                  key={pain.quote}
                  className="group relative flex flex-col rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-5 bg-slate-100">
                    <Image
                      src={pain.image}
                      alt={pain.quote}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <Quote className="h-5 w-5 text-slate-200 mb-2" />
                  <p className="text-base font-semibold text-slate-800 leading-snug mb-5">
                    « {pain.quote} »
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isFlow ? 'flow-gradient' : 'bg-gradient-to-br from-sky-500 to-blue-500'}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${isFlow ? 'text-blue-600' : 'text-sky-600'} ${isFlow ? 'font-display not-italic' : ''}`}>
                        {pain.pillar}
                      </div>
                      <div className="text-xs text-slate-600 font-medium leading-tight">{pain.solution}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── DEUX PILIERS ─── */}
      <section id="pillars" ref={pillars.ref} className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[500px] rounded-full bg-[#4169F6]/[0.06] blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[500px] rounded-full bg-sky-200/40 blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center mb-14 transition-all duration-700 ${
            pillars.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Une plateforme, deux piliers.
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Tout ce qu&apos;il faut pour faire tourner votre cabinet, et tout ce qu&apos;il faut pour devenir meilleur clinicien.
            </p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 delay-200 ${
            pillars.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* MyOsteoflow pillar */}
            <div className="relative rounded-3xl bg-white border border-slate-200 p-8 overflow-hidden hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-48 h-48 flow-gradient opacity-[0.07] rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl flow-gradient flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Monitor className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-display italic flow-text font-bold text-xl">MyOsteoflow</div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Gestion de cabinet</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Votre cabinet, fluidifié.</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Le logiciel qui gère les patients, les consultations, la facturation et la compta, pour que vous restiez concentré sur le soin.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 mb-7">
                  {[
                    "Dictée vocale par IA",
                    "Suivi patient automatisé (J+7)",
                    "Courriers générés par IA",
                    "Messagerie patients",
                    "Dossiers patients complets",
                    "Comptabilité & factures",
                    "Objectifs & chiffre d'affaires",
                    "Statistiques du cabinet",
                    "Aide au raisonnement clinique",
                    "Données 100% locales & RGPD",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => scrollTo('myosteoflow')}
                  className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:gap-3 transition-all"
                >
                  Explorer MyOsteoflow <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* OsteoUpgrade pillar */}
            <div className="relative rounded-3xl bg-white border border-slate-200 p-8 overflow-hidden hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-sky-500 to-blue-500 opacity-[0.07] rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-xl text-slate-900">Osteo<span className="text-sky-500">Upgrade</span></div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Montée en compétence</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Votre expertise, augmentée.</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  La base de connaissances clinique qui lève vos doutes et garde votre pratique alignée sur les dernières preuves scientifiques.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 mb-7">
                  {[
                    '200+ tests orthopédiques',
                    'Aide au raisonnement clinique',
                    'OsteoFlash - Flashcards',
                    'Topographie clinique par région',
                    'Cours & e-learning',
                    'Quiz interactifs',
                    'Revue de littérature mensuelle',
                    '150+ techniques en vidéo',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => scrollTo('osteoupgrade')}
                  className="inline-flex items-center gap-2 text-sm font-bold text-sky-600 hover:gap-3 transition-all"
                >
                  Explorer OsteoUpgrade <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MYOSTEOFLOW DEEP-DIVE ─── */}
      <section id="myosteoflow" ref={flow.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* flow gradient halos */}
        <div className="absolute top-0 right-0 w-[750px] h-[550px] rounded-full bg-[#4169F6]/[0.07] blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[550px] h-[420px] rounded-full bg-violet-300/30 blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center mb-16 transition-all duration-700 ${
            flow.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              <Monitor className="h-3.5 w-3.5" />
              MyOsteoflow · Gestion de cabinet
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Le cabinet qui tourne
              <br />
              <span className="flow-text">pendant que vous soignez.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Un logiciel de cabinet pensé pour les thérapeutes manuels, avec des automatisations qui n&apos;existent nulle part ailleurs.
            </p>
          </div>

          {/* HERO FEATURE — AI voice dictation */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-16 transition-all duration-700 delay-100 ${
            flow.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-5">
                <Sparkles className="h-3 w-3" />
                La fonctionnalité signature
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Dictez. L&apos;IA structure votre consultation.
              </h3>
              <p className="text-slate-500 leading-relaxed mb-6">
                Parlez naturellement pendant ou après la séance. La dictée vocale transcrit en temps réel,
                puis l&apos;IA range automatiquement le contenu : motif, anamnèse, antécédents, profession, activité sportive…
                Vous gardez les yeux sur votre patient, pas sur votre clavier.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  'Transcription vocale en français, en temps réel',
                  'Extraction automatique des champs du dossier',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="aspect-[16/7] w-full rounded-xl overflow-hidden">
                <iframe
                  src="https://player.vimeo.com/video/1203912444?title=0&byline=0&portrait=0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  className="w-full h-full"
                  style={{ border: 0 }}
                />
              </div>
            </div>

            {/* AI dictation mock */}
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-[#0a1024] via-[#0d1430] to-[#120f33] p-6 sm:p-7 shadow-2xl border border-blue-500/10">
                {/* header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flow-gradient flex items-center justify-center">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-blue-300/70 font-medium">Nouvelle consultation</div>
                      <div className="text-white font-bold text-sm">Mme Marie D. · 34 ans</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 text-red-300 text-[10px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    REC 02:14
                  </div>
                </div>

                {/* waveform */}
                <div className="flex items-end justify-center gap-1 h-12 mb-4 px-2">
                  {[40, 70, 30, 90, 55, 80, 45, 95, 35, 65, 50, 85, 40, 75, 30, 60, 90, 45].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-full flow-gradient animate-wave"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.07}s` }}
                    />
                  ))}
                </div>

                {/* live transcript */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 mb-4">
                  <div className="text-[10px] text-blue-300/60 font-semibold uppercase tracking-wider mb-1.5">Transcription en direct</div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    « La patiente consulte pour des cervicalgies droites depuis trois semaines,
                    apparues après une longue période de télétravail. Kinésithérapeute de profession,
                    pratique le yoga deux fois par semaine… »
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-blue-300/70 font-semibold mb-4">
                  <Sparkles className="h-3 w-3" />
                  L&apos;IA structure le dossier
                </div>

                {/* structured fields */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Motif', value: 'Cervicalgie droite' },
                    { label: 'Depuis', value: '3 semaines' },
                    { label: 'Profession', value: 'Kinésithérapeute' },
                    { label: 'Sport', value: 'Yoga · 2×/sem' },
                  ].map((field) => (
                    <div key={field.label} className="rounded-lg bg-white/5 border border-white/10 p-2.5">
                      <div className="text-[9px] text-blue-300/60 font-semibold uppercase tracking-wider">{field.label}</div>
                      <div className="text-xs text-white font-semibold mt-0.5">{field.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/30 animate-float">
                Dossier rempli ✨
              </div>
            </div>
          </div>

          {/* SECONDARY FEATURES GRID */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 delay-200 ${
            flow.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {flowFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="relative rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all">
                  {feature.badge && (
                    <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider flow-text">
                      {feature.badge}
                    </span>
                  )}
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl flow-gradient mb-4 shadow-sm shadow-blue-500/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5">{feature.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => router.push('/auth')}
              className="group flow-gradient text-white px-7 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 inline-flex items-center gap-2"
            >
              Commencer avec MyOsteoflow
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── OSTEOUPGRADE DEEP-DIVE (interactive explorer) ─── */}
      <section id="osteoupgrade" ref={upgrade.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200/50 relative overflow-hidden">
        {/* Sky/blue halos */}
        <div className="absolute top-0 right-0 w-[750px] h-[550px] rounded-full bg-sky-200/55 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[550px] h-[420px] rounded-full bg-blue-100/50 blur-[130px] pointer-events-none" />

        {/* Tint that follows the active feature */}
        {upgradeFeatures.map((feature, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              activeFeature === i ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ background: `radial-gradient(ellipse 55% 50% at 72% 40%, rgba(${feature.glow}, 0.07) 0%, transparent 70%)` }}
          />
        ))}

        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center mb-16 transition-all duration-700 ${
            upgrade.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              <GraduationCap className="h-3.5 w-3.5" />
              OsteoUpgrade · Montée en compétence
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Votre doute.
              <br />
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Notre réponse.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Cliquez sur votre situation pour découvrir le contenu clinique qui y répond.
            </p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start transition-all duration-700 delay-200 ${
            upgrade.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>

            {/* Left: Question cards */}
            <div className="lg:col-span-2 space-y-2.5">
              {upgradeFeatures.map((feature, i) => {
                const Icon = feature.icon
                const isActive = activeFeature === i
                return (
                  <button
                    key={i}
                    onClick={() => setActiveFeature(i)}
                    className={`group w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-white border-slate-200 shadow-md'
                        : 'bg-white/60 border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                    style={isActive ? {
                      boxShadow: `0 4px 20px rgba(${feature.glow}, 0.16), 0 1px 4px rgba(0,0,0,0.05)`,
                      borderColor: `rgba(${feature.glow}, 0.30)`
                    } : {}}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${feature.gradient} transition-all duration-300 ${
                          isActive ? 'scale-110' : 'opacity-40 group-hover:opacity-60'
                        }`}
                        style={isActive ? { boxShadow: `0 4px 12px rgba(${feature.glow}, 0.40)` } : {}}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className={`text-sm font-semibold leading-snug flex-1 transition-colors duration-300 ${
                        isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
                      }`}>
                        {feature.painPoint}
                      </p>
                      <ChevronRight
                        className="h-4 w-4 flex-shrink-0 transition-all duration-300"
                        style={{
                          color: isActive ? `rgba(${feature.glow}, 0.8)` : 'rgb(203 213 225)',
                          transform: isActive ? 'translateX(2px)' : undefined
                        }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right: Solution reveal panel */}
            <div className="lg:col-span-3 lg:sticky lg:top-24">
              <div className="relative">
                {upgradeFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className={`absolute -inset-6 rounded-[2.5rem] blur-2xl transition-opacity duration-700 pointer-events-none ${
                      activeFeature === i ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ background: `radial-gradient(ellipse at center, rgba(${feature.glow}, 0.13) 0%, transparent 70%)` }}
                  />
                ))}

                <div className="grid">
                  {upgradeFeatures.map((feature, i) => {
                    const Icon = feature.icon
                    return (
                      <div
                        key={i}
                        className={`[grid-area:1/1] transition-all duration-500 ${
                          activeFeature === i
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-3 pointer-events-none'
                        }`}
                      >
                        <div
                          className="rounded-2xl overflow-hidden bg-white"
                          style={{
                            border: `1.5px solid rgba(${feature.glow}, 0.22)`,
                            boxShadow: `0 12px 48px rgba(${feature.glow}, 0.13), 0 2px 8px rgba(0,0,0,0.07)`
                          }}
                        >
                          <div
                            className="p-6 sm:p-7 pb-5"
                            style={{ background: `linear-gradient(135deg, rgba(${feature.glow}, 0.10) 0%, rgba(${feature.glow}, 0.03) 60%, white 100%)` }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}
                                style={{ boxShadow: `0 4px 16px rgba(${feature.glow}, 0.35)` }}
                              >
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p
                                  className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                                  style={{ color: `rgba(${feature.glow}, 0.75)` }}
                                >
                                  La solution
                                </p>
                                <h3 className="text-base font-bold text-slate-900">{feature.title}</h3>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed mb-4">{feature.desc}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {feature.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border"
                                  style={{
                                    background: `rgba(${feature.glow}, 0.08)`,
                                    borderColor: `rgba(${feature.glow}, 0.20)`,
                                    color: `rgba(${feature.glow}, 0.90)`
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mx-5 mb-5 sm:mx-6 sm:mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200">
                              <div className="flex gap-1">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                              </div>
                              <div className="flex-1 flex justify-center">
                                <div className="px-3 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-400 font-mono">osteo-upgrade.fr</div>
                              </div>
                            </div>
                            <div className="relative aspect-[16/9]">
                              <Image
                                src={feature.screenshot}
                                alt={`Aperçu - ${feature.title}`}
                                fill
                                className="object-cover object-top"
                                sizes="(max-width: 1024px) 100vw, 700px"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PHILOSOPHIE ─── */}
      <section className="py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              Notre philosophie
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Construit par des cliniciens,
              <br />
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">pour des cliniciens.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Un constat simple : un thérapeute manuel passe trop de temps sur l&apos;administratif et trop peu à se former. On a réuni les deux réponses au même endroit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: 'Vous rend du temps',
                desc: "Dictée vocale, factures, suivi patient et compta automatisés. MyOsteoflow gère l'intendance pour que vous restiez sur le soin.",
                accent: 'from-blue-500 to-violet-600',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
              },
              {
                icon: Brain,
                title: 'Ancré dans la science',
                desc: "Chaque test, pathologie et protocole est documenté avec sa sensibilité, sa spécificité et ses références EBP. Pas d'opinion, que des preuves.",
                accent: 'from-sky-500 to-blue-600',
                bg: 'bg-sky-50',
                border: 'border-sky-100',
              },
              {
                icon: TrendingUp,
                title: 'Évolue chaque mois',
                desc: 'Nouvelles revues de littérature, nouveaux contenus, nouvelles fonctionnalités. La plateforme grandit avec votre pratique.',
                accent: 'from-violet-500 to-purple-600',
                bg: 'bg-violet-50',
                border: 'border-violet-100',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className={`rounded-2xl ${item.bg} border ${item.border} p-7`}>
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${item.accent} mb-5`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── TARIFS ─── */}
      <section id="pricing" ref={pricing.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[500px] rounded-full bg-sky-200/40 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full bg-blue-100/40 blur-[130px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className={`text-center mb-14 transition-all duration-700 ${
            pricing.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-full text-sm font-bold mb-6 uppercase tracking-wider">
              <Crown className="h-4 w-4" />
              Tarifs
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Les deux outils.
              <br />
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                49,99&euro;/mois, sans engagement.
              </span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              MyOsteoflow et OsteoUpgrade dans un seul abonnement.
            </p>
          </div>

          <div className={`transition-all duration-700 delay-100 ${
            pricing.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free */}
              <div className="rounded-2xl bg-white border border-slate-200 p-8 hover:shadow-lg transition-all">
                <div className="mb-8">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Gratuit</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-slate-900">0&euro;</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-3">Découvrez la plateforme avec le module épaule complet, sans carte bancaire.</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Module épaule complet',
                    'Tests orthopédiques épaule',
                    'E-learning épaule',
                    'Topographie épaule',
                    'Outils de base',
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => router.push('/auth')}
                  className="w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  Commencer gratuitement
                </button>
              </div>

              {/* Premium */}
              <div className="rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 rounded-2xl" />
                <div className="absolute inset-[2px] bg-white rounded-[14px]" />
                <div className="relative p-8">
                  <div className="absolute top-6 right-6">
                    <div className="flex items-center gap-1 bg-sky-50 text-sky-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                      <Crown className="h-3.5 w-3.5" />
                      Recommandé
                    </div>
                  </div>
                  <div className="mb-7">
                    <div className="text-sm font-semibold text-sky-600 uppercase tracking-wider mb-2">Premium</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-5xl font-bold text-slate-900">49,99&euro;</span>
                      <span className="text-slate-400 text-sm">/mois</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Sans engagement · Prélevé chaque mois · Annulable à tout moment</p>
                    <p className="text-xs text-emerald-600 font-semibold mb-4">Déductible des frais professionnels</p>
                    <div className="rounded-xl bg-sky-50 border border-sky-200 p-3">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-sky-600 flex-shrink-0" />
                        <span className="text-sm font-bold text-slate-900">Parrainage : 1 mois offert</span>
                      </div>
                      <p className="text-[11px] text-sky-700 mt-0.5">Pour vous et votre filleul à chaque parrainage validé</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-7">
                    {[
                      'MyOsteoflow : logiciel de cabinet complet',
                      'Dictée vocale IA & suivi patient automatisé',
                      'Aide au raisonnement clinique avec proposition de tests ortho',
                      'Toutes les régions anatomiques',
                      'Bibliothèque complète de tests',
                      'OsteoFlash - Flashcards',
                      'E-learning complet et quiz',
                      'Revue de littérature mensuelle',
                      'Topographie clinique',
                      'Parrainage : 1 mois offert (parrain & filleul)',
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => router.push('/auth')}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm hover:from-sky-400 hover:to-blue-500 transition-all shadow-lg shadow-sky-500/20"
                    >
                      Choisir Premium · 49,99&euro;/mois
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400">
                49,99&euro;/mois, sans engagement. Annulable à tout moment depuis votre compte. Déductible des frais professionnels.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section ref={cta.ref} className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b19] via-[#0c1226] to-[#0f132a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#4169F6]/[0.08] blur-[150px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] rounded-full bg-violet-500/[0.06] blur-[120px]" />

        <div className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${
          cta.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            Votre cabinet et votre clinique,
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              au même endroit.
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-4 max-w-lg mx-auto">
            MyOsteoflow pour gérer, OsteoUpgrade pour progresser.
            Le tout pour 49,99&euro;/mois, sans engagement.
          </p>
          <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto">
            Commencez gratuitement avec le module épaule. Sans carte bancaire.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="group flow-gradient text-white px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 inline-flex items-center gap-3"
          >
            Commencer maintenant
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <PublicFooter />
    </div>
  )
}
