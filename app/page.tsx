'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import PublicFooter from '@/components/PublicFooter'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  ArrowRight,
  Stethoscope,
  GraduationCap,
  TestTube2,
  Map,
  Dumbbell,
  FileText,
  Calendar,
  Play,
  Star,
  Shield,
  Sparkles,
  Brain,
  ChevronRight,
  Menu,
  X,
  Crown,
  BookOpen,
  HeartPulse,
  Trophy,
  Flame,
  Gift,
  Users,
  Wallet,
  Award,
  Zap,
  Target,
  Monitor,
  Newspaper,
  Video,
  MessageSquare,
  TrendingUp
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

// Screenshot paths for features
const SCREENSHOT_PATHS: Record<string, string> = {
  hero: '/landing/screenshots/hero.png',
  tests: '/landing/screenshots/tests.png',
  diagnostics: '/landing/screenshots/diagnostics.png',
  topographie: '/landing/screenshots/topographie.png',
  elearning: '/landing/screenshots/elearning.png',
  videos: '/landing/screenshots/videos.png',
  exercices: '/landing/screenshots/exercices.png',
}

// Hero screenshot in a browser chrome frame
function HeroScreenshot() {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Browser chrome */}
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

        {/* Screenshot */}
        <div className="relative aspect-[14/9]">
          <Image
            src={SCREENSHOT_PATHS.hero}
            alt="Interface OsteoUpgrade - Tests orthopediques, diagnostics et e-learning"
            fill
            className="object-cover object-top"
            priority
            sizes="(max-width: 768px) 100vw, 560px"
          />
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-4 -right-4 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/30 animate-float">
        +15 XP
      </div>
      <div className="absolute -bottom-3 -left-4 px-3 py-1.5 rounded-xl bg-sky-500 text-white text-[10px] font-bold shadow-lg shadow-sky-500/30 animate-float-delayed">
        Niveau 5
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  const hero = useScrollReveal()
  const stats = useScrollReveal()
  const features = useScrollReveal()
  const gamification = useScrollReveal()
  const pricing = useScrollReveal()
  const cta = useScrollReveal()
  const osteoflow = useScrollReveal()

  useEffect(() => {
    setIsVisible(true)
  }, [])

const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const featuresList = [
    {
      icon: TestTube2,
      title: 'Tests orthopédiques',
      painPoint: 'Un doute sur un test à utiliser ?',
      desc: 'Notre bibliothèque de 200+ tests orthopédiques classés par région anatomique, avec sensibilité, spécificité, vidéos démonstratives et indication clinique. Trouvez le bon test en quelques secondes.',
      gradient: 'from-blue-500 to-cyan-500',
      screenshot: SCREENSHOT_PATHS.tests,
      glow: '14, 165, 233',
      tags: ['200+ tests', 'Sensi / Spéci', 'Vidéos démo', 'Par région'],
    },
    {
      icon: Map,
      title: 'Topographie clinique',
      painPoint: 'Un doute sur la douleur d\'un patient ?',
      desc: 'Notre bibliothèque d\'aide au diagnostic topographique région par région. Identifiez rapidement les structures impliquées et orientez votre bilan clinique.',
      gradient: 'from-sky-500 to-indigo-500',
      screenshot: SCREENSHOT_PATHS.topographie,
      glow: '99, 102, 241',
      tags: ['Par région', 'Structures', 'Aide diagnostic', 'Raisonnement'],
    },
    {
      icon: GraduationCap,
      title: 'E-Learning & Revue d\'études',
      painPoint: 'Perdu dans la masse d\'études scientifiques ?',
      desc: 'Cours structurés, revues de littérature mensuelles et quiz interactifs. Chaque mois, les meilleures études EBP passées en revue et synthétisées pour la pratique.',
      gradient: 'from-violet-500 to-purple-500',
      screenshot: SCREENSHOT_PATHS.elearning,
      glow: '139, 92, 246',
      tags: ['500+ contenus', 'EBP mensuel', 'Quiz', 'Revue littérature'],
    },
    {
      icon: Play,
      title: 'Techniques en vidéo',
      painPoint: 'Vous manquez de techniques ?',
      desc: 'Notre catalogue de 150+ techniques de thérapie manuelle (HVLA, mobilisation, tissulaire) organisées par région anatomique, avec démonstrations vidéo détaillées.',
      gradient: 'from-orange-500 to-red-500',
      screenshot: SCREENSHOT_PATHS.videos,
      glow: '249, 115, 22',
      tags: ['150+ techniques', 'HVLA', 'Mobilisation', 'Tissulaire'],
    },
    {
      icon: Dumbbell,
      title: 'Outils professionnels',
      painPoint: 'Vous voulez optimiser votre cabinet ?',
      desc: 'Modèles de courriers prêts à l\'emploi, posters pour salle d\'attente et supports de communication. Tout pour optimiser votre cabinet au quotidien.',
      gradient: 'from-emerald-500 to-teal-500',
      screenshot: SCREENSHOT_PATHS.exercices,
      glow: '16, 185, 129',
      tags: ['Modèles courriers', 'Posters', 'Communication', 'PDF prêts'],
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-x-hidden">

      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <div className="text-xl font-bold tracking-tight">
              Osteo<span className="text-sky-500">Upgrade</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8">
              {[
                { label: 'Fonctionnalites', id: 'features' },
                { label: 'MyOsteoFlow', id: 'osteoflow' },
                { label: 'Tarifs', id: 'pricing' },
              ].map((item) => (
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
                className="bg-gradient-to-r from-sky-500 to-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-sky-400 hover:to-blue-400 transition-all shadow-sm hover:shadow-md"
              >
                Essai gratuit
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -mr-2"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1">
            {[
              { label: 'Fonctionnalites', id: 'features' },
              { label: 'MyOsteoFlow', id: 'osteoflow' },
              { label: 'Tarifs', id: 'pricing' },
            ].map((item) => (
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

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070b19] via-[#0c1528] to-[#0f172a]" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Ambient glow */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-sky-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/[0.05] blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 px-4 py-2 rounded-full text-xs font-semibold mb-8 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Conçu par des ostéopathes, pour des ostéopathes
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
                Ne laissez plus
                <br />
                vos doutes
                <br />
                <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  freiner votre pratique
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed">
                Maîtrisez les dernières preuves scientifiques (EBP) avec des
                <span className="text-slate-300 font-medium"> protocoles concrets, applicables dès demain en cabinet.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={() => router.push('/auth')}
                  className="group bg-gradient-to-r from-sky-500 to-blue-500 text-white px-7 py-4 rounded-xl font-bold text-base hover:from-sky-400 hover:to-blue-400 transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 flex items-center justify-center gap-2"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => scrollTo('features')}
                  className="text-white/70 border border-white/15 px-7 py-4 rounded-xl font-semibold text-base hover:bg-white/5 hover:text-white hover:border-white/25 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  Découvrir la plateforme
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Sans carte bancaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Module épaule complet</span>
                </div>
              </div>
            </div>

            {/* Right: App Screenshot */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <HeroScreenshot />
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
              { value: 200, suffix: '+', label: 'Tests orthopédiques', icon: TestTube2 },
              { value: 150, suffix: '+', label: 'Pathologies détaillées', icon: Stethoscope },
              { value: 150, suffix: '+', label: 'Vidéos techniques', icon: Play },
              { value: 500, suffix: '+', label: 'Contenus e-learning', icon: BookOpen },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 mb-3">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-slate-900 mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" ref={features.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">

        {/* Sky/blue halos — couleur principale de la section */}
        <div className="absolute top-0 right-0 w-[750px] h-[550px] rounded-full bg-sky-200/55 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[550px] h-[420px] rounded-full bg-blue-100/50 blur-[130px] pointer-events-none" />

        {/* Tint ambiant coloré qui suit la feature active */}
        {featuresList.map((feature, i) => (
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
            features.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              La plateforme
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Votre doute.
              <br />
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Notre reponse.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Cliquez sur votre situation pour decouvrir comment OsteoUpgrade vous accompagne.
            </p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 items-start transition-all duration-700 delay-200 ${
            features.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>

            {/* Left: Question cards — blanc sur fond slate-50 */}
            <div className="lg:col-span-2 space-y-2.5">
              {featuresList.map((feature, i) => {
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

                {/* Glow halo derrière le panneau */}
                {featuresList.map((feature, i) => (
                  <div
                    key={i}
                    className={`absolute -inset-6 rounded-[2.5rem] blur-2xl transition-opacity duration-700 pointer-events-none ${
                      activeFeature === i ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ background: `radial-gradient(ellipse at center, rgba(${feature.glow}, 0.13) 0%, transparent 70%)` }}
                  />
                ))}

                {/* Panels stacked via CSS grid overlay */}
                <div className="grid">
                  {featuresList.map((feature, i) => {
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
                          {/* Header coloré */}
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

                          {/* Screenshot */}
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
                                alt={`Apercu - ${feature.title}`}
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

      {/* ─── GAMIFICATION / REWARDS ─── */}
      <section ref={gamification.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Purple/indigo halos — couleur principale de la section */}
        <div className="absolute top-0 right-0 w-[750px] h-[550px] rounded-full bg-purple-200/50 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[550px] h-[420px] rounded-full bg-indigo-100/50 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center mb-16 transition-all duration-700 ${
            gamification.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              <Trophy className="h-3.5 w-3.5" />
              Système de récompenses
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Progresse. Débloque.
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Reste motivé.
              </span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Chaque action sur la plateforme te fait gagner de l&apos;XP.
              Monte en niveau, débloque des badges et maintiens ta série quotidienne.
            </p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-700 delay-200 ${
            gamification.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Left: Visual mock of the gamification system */}
            <div className="relative">
              <div className="rounded-2xl bg-gradient-to-br from-[#1a103d] via-[#1e1145] to-[#15103a] p-6 sm:p-8 shadow-2xl border border-purple-500/10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-purple-300 font-medium">Progression globale</div>
                      <div className="text-white font-bold text-lg">Niveau 7</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">3&thinsp;450</div>
                    <div className="text-[10px] text-purple-300">XP total</div>
                  </div>
                </div>

                {/* XP Progress bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-[10px] text-purple-300 mb-1.5">
                    <span>Niveau 7</span>
                    <span>450/500 XP</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-400 w-[90%] transition-all" />
                  </div>
                  <div className="text-[10px] text-purple-400 mt-1">Plus que 50 XP pour le niveau 8</div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: Flame, label: 'Série', value: '12 jours', color: 'text-orange-300', bg: 'bg-orange-500/15' },
                    { icon: Zap, label: 'Semaine', value: '24 actions', color: 'text-cyan-300', bg: 'bg-cyan-500/15' },
                    { icon: Award, label: 'Badges', value: '8 / 20', color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
                  ].map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className={`rounded-xl ${stat.bg} p-3`}>
                        <Icon className={`h-4 w-4 ${stat.color} mb-1.5`} />
                        <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-purple-300">{stat.label}</div>
                      </div>
                    )
                  })}
                </div>

                {/* Badges row */}
                <div className="border-t border-white/10 pt-5">
                  <div className="text-xs font-semibold text-purple-200 mb-3 flex items-center gap-2">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    Derniers badges débloqués
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Premier pas', icon: '🎯', color: 'bg-emerald-500/15 border-emerald-500/20' },
                      { name: 'Assidu', icon: '🔥', color: 'bg-orange-500/15 border-orange-500/20' },
                      { name: 'Savant', icon: '🧠', color: 'bg-blue-500/15 border-blue-500/20' },
                    ].map((badge) => (
                      <div key={badge.name} className={`rounded-lg ${badge.color} border p-2.5 text-center`}>
                        <div className="text-lg mb-0.5">{badge.icon}</div>
                        <div className="text-[9px] text-white/70 font-medium">{badge.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating notification */}
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-emerald-500 text-white px-3 py-2 rounded-xl shadow-lg shadow-emerald-500/30 animate-float">
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">+25 XP</span>
                </div>
                <div className="text-[9px] text-emerald-100">Cours terminé !</div>
              </div>
            </div>

            {/* Right: Description */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Chaque effort compte
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Compléter un cours, visionner une technique, consulter un test...
                  Chaque action sur la plateforme te rapporte de l&apos;XP et te fait progresser.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Trophy,
                    title: 'Niveaux & XP',
                    desc: 'Gagne de l\'XP à chaque action. Monte en niveau et suis ta progression globale.',
                    color: 'from-amber-500 to-orange-500'
                  },
                  {
                    icon: Flame,
                    title: 'Séries quotidiennes',
                    desc: 'Connecte-toi chaque jour pour maintenir ta série et débloquer des bonus.',
                    color: 'from-orange-500 to-red-500'
                  },
                  {
                    icon: Award,
                    title: 'Badges exclusifs',
                    desc: 'Débloque des badges en atteignant des objectifs : premier cours, 10 tests, 30 jours...',
                    color: 'from-purple-500 to-indigo-500'
                  },
                  {
                    icon: Target,
                    title: 'Objectifs hebdo',
                    desc: 'Des objectifs chaque semaine pour rester engagé et progresser régulièrement.',
                    color: 'from-emerald-500 to-teal-500'
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-xl bg-white border border-slate-200 p-4 hover:shadow-md transition-all">
                      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} mb-3`}>
                        <Icon className="h-4.5 w-4.5 text-white" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MYOSTEOFLOW — INCLUS PREMIUM ─── */}
      <section id="osteoflow" ref={osteoflow.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200/50 relative overflow-hidden">
        {/* Sky/blue halos — couleur principale de la section */}
        <div className="absolute top-0 right-0 w-[750px] h-[550px] rounded-full bg-sky-200/55 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[550px] h-[420px] rounded-full bg-blue-100/50 blur-[130px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className={`transition-all duration-700 ${
            osteoflow.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="flex items-center gap-3 mb-8">
              <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 border border-violet-200 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <Crown className="h-3 w-3" />
                Inclus avec Premium
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Content */}
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
                  Votre logiciel de cabinet
                  <br />
                  <span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">
                    inclus dans l&apos;abonnement.
                  </span>
                </h2>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                  <span className="font-semibold text-slate-700">MyOsteoFlow</span> est notre logiciel de gestion cabinet desktop, inclus avec l&apos;abonnement Premium. Toutes vos données restent sur votre machine, sans abonnement supplémentaire.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { icon: Users, label: 'Dossiers patients', desc: 'Fiches complètes avec historique de soins, anamnèse et notes de consultation' },
                    { icon: Calendar, label: 'Consultations détaillées', desc: 'Suivi de chaque séance, avec historique complet et recherche par patient' },
                    { icon: Brain, label: 'Prise de note par IA', desc: 'Structuration automatique de vos notes de consultation grâce à l\'IA intégrée' },
                    { icon: Target, label: 'Objectifs du cabinet', desc: 'Définissez et suivez vos objectifs de consultation, de CA et de progression' },
                    { icon: Wallet, label: 'Comptabilité et factures', desc: 'Gestion financière complète avec exports, factures et récapitulatifs' },
                    { icon: TrendingUp, label: 'Statistiques cabinet', desc: 'Visualisez l\'activité de votre cabinet et suivez votre évolution mois par mois' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="rounded-xl bg-white border border-slate-200 p-4 hover:shadow-md transition-all">
                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 mb-3">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-0.5">{item.label}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => router.push('/auth')}
                  className="group bg-gradient-to-r from-sky-500 to-blue-500 text-white px-7 py-4 rounded-xl font-bold text-base hover:from-sky-400 hover:to-blue-400 transition-all shadow-lg shadow-sky-500/20 inline-flex items-center gap-2"
                >
                  Commencer avec MyOsteoFlow
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Right: Visual mock */}
              <div className="relative">
                <div className="rounded-2xl bg-gradient-to-br from-[#0a1628] via-[#0c1a35] to-[#0f172a] p-6 sm:p-8 shadow-2xl border border-sky-500/10">
                  {/* App header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-sky-300/70 font-medium">Tableau de bord</div>
                      <div className="text-white font-bold text-lg">MyOsteoFlow</div>
                    </div>
                    <div className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      En ligne
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: 'Patients', value: '124', color: 'text-sky-300', bg: 'bg-sky-500/15' },
                      { label: 'Ce mois', value: '38', color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
                      { label: 'CA/mois', value: '4 200\u20ac', color: 'text-amber-300', bg: 'bg-amber-500/15' },
                    ].map((stat) => (
                      <div key={stat.label} className={`rounded-xl ${stat.bg} p-3 text-center`}>
                        <div className={`text-base font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-white/50 mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Message preview */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                      <span className="text-xs font-semibold text-white/80">Messagerie patients</span>
                      <span className="ml-auto px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[9px] font-bold">3</span>
                    </div>
                    {[
                      { name: 'Marie D.', msg: 'Bonjour, puis-je reporter...', time: '14:32' },
                      { name: 'Thomas B.', msg: 'Merci pour la seance !', time: '11:15' },
                    ].map((msg) => (
                      <div key={msg.name} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-[8px] text-white font-bold flex-shrink-0">
                          {msg.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold text-white/80">{msg.name}</div>
                          <div className="text-[9px] text-white/40 truncate">{msg.msg}</div>
                        </div>
                        <div className="text-[9px] text-white/30">{msg.time}</div>
                      </div>
                    ))}
                  </div>

                  {/* Bar chart mock */}
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-[10px] text-white/50 mb-3">Consultations / semaine</div>
                    <div className="flex items-end gap-1.5 h-10">
                      {[60, 80, 45, 90, 70, 95, 55].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-sky-600 to-sky-400 opacity-80"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-[10px] font-bold shadow-lg shadow-violet-500/30 animate-float">
                  Inclus Premium
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── NOTRE ENGAGEMENT ─── */}
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
              OsteoUpgrade est né d&apos;un constat simple : les ressources cliniques de qualité sont éparpillées, coûteuses et difficiles à appliquer en cabinet. On a changé ça.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'Ancre dans la science',
                desc: 'Chaque test, chaque pathologie, chaque protocole est documenté avec sa sensibilité, sa spécificité et ses références EBP. Pas d\'opinion, que des preuves.',
                accent: 'from-sky-500 to-blue-600',
                bg: 'bg-sky-50',
                border: 'border-sky-100',
              },
              {
                icon: Stethoscope,
                title: 'Pense pour le cabinet',
                desc: 'Conçu pour être consulté en 10 secondes entre deux patients. Interface claire, recherche instantanée, contenu directement actionnable. Pas un cours magistral.',
                accent: 'from-emerald-500 to-teal-600',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
              },
              {
                icon: TrendingUp,
                title: 'Evolue chaque mois',
                desc: 'Nouvelles revues de littérature, nouveaux contenus, nouvelles fonctionnalités. La plateforme grandit avec votre pratique et intègre les dernières publications.',
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

      {/* ─── TARIFS ET COMPARAISON ─── */}
      <section id="pricing" ref={pricing.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[500px] rounded-full bg-amber-200/40 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] rounded-full bg-sky-100/40 blur-[130px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className={`text-center mb-14 transition-all duration-700 ${
            pricing.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 rounded-full text-sm font-bold mb-6 uppercase tracking-wider">
              <Crown className="h-4 w-4" />
              Tarifs
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Tout inclus.
              <br />
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Dès 35&euro;/mois ou 299&euro;/an.
              </span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              OsteoUpgrade et MyOsteoFlow dans un seul abonnement, pour moins que les alternatives séparées.
            </p>
          </div>

          <div className={`transition-all duration-700 delay-100 ${
            pricing.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Comparatif */}
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-xl mb-10">
              <div className="grid grid-cols-2 bg-slate-100">
                <div className="px-8 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Alternatives séparées</div>
                <div className="px-8 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Crown className="h-4 w-4" /> Premium tout inclus
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-200">
                <div className="px-8 py-6 bg-white flex items-center gap-5">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Monitor className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Logiciel de cabinet</div>
                    <div className="text-xs text-slate-400 mb-1">ex. Doctolink, Osteo2ls</div>
                    <div className="text-2xl font-black text-red-400 line-through decoration-red-300">300&euro;/an</div>
                  </div>
                </div>
                <div className="px-8 py-6 bg-amber-50 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-xs">✓</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">MyOsteoFlow inclus</div>
                    <div className="text-xs text-slate-600">Dossiers, consultations, IA, comptabilité, factures</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-200">
                <div className="px-8 py-6 bg-white flex items-center gap-5">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <Play className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Formations techniques vidéo</div>
                    <div className="text-xs text-slate-400 mb-1">plateformes de formation ostéo</div>
                    <div className="text-2xl font-black text-red-400 line-through decoration-red-300">200&euro;/an</div>
                  </div>
                </div>
                <div className="px-8 py-6 bg-amber-50 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-xs">✓</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">150+ techniques incluses</div>
                    <div className="text-xs text-slate-600">HVLA, mobilisation, tissulaire, par région</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-200">
                <div className="px-8 py-6 bg-white flex items-center gap-5">
                  <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Plateforme e-learning EBP</div>
                    <div className="text-xs text-slate-400 mb-1">accès limité, sans revue mensuelle</div>
                    <div className="text-2xl font-black text-red-400 line-through decoration-red-300">250&euro;/an</div>
                  </div>
                </div>
                <div className="px-8 py-6 bg-amber-50 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-xs">✓</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">E-learning illimité inclus</div>
                    <div className="text-xs text-slate-600">Cours, quiz et revue de littérature mensuelle</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-200">
                <div className="px-8 py-6 bg-white flex items-center gap-5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Gift className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">Programme ambassadeur</div>
                    <div className="text-xs text-slate-400">inexistant chez les concurrents</div>
                    <div className="text-2xl font-black text-slate-300 mt-1">n/a</div>
                  </div>
                </div>
                <div className="px-8 py-6 bg-amber-50 flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-black text-xs">✓</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">10% de commission par filleul</div>
                    <div className="text-xs text-slate-600">10 filleuls = abonnement entièrement remboursé</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t-2 border-slate-300">
                <div className="px-8 py-7 bg-slate-900 flex items-center">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total alternatives séparées</div>
                    <div className="text-xs text-slate-500 mb-2">300 + 200 + 250 = 750&euro; minimum</div>
                    <div className="text-4xl font-black text-red-400 line-through decoration-red-400">750&euro;+/an</div>
                  </div>
                </div>
                <div className="px-8 py-7 bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Premium tout inclus</div>
                    <div className="text-4xl font-black text-white">299&euro;/an</div>
                    <div className="text-sm text-white/80 mt-1">soit 24,90&euro;/mois · 3 mois offerts</div>
                  </div>
                  <button
                    onClick={() => router.push('/auth')}
                    className="group bg-white text-amber-600 px-5 py-3.5 rounded-2xl font-black text-sm hover:bg-amber-50 transition-all shadow-lg inline-flex items-center gap-2 flex-shrink-0"
                  >
                    Je démarre
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>

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
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl" />
                <div className="absolute inset-[2px] bg-white rounded-[14px]" />
                <div className="relative p-8">
                  <div className="absolute top-6 right-6">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                      <Crown className="h-3.5 w-3.5" />
                      Recommandé
                    </div>
                  </div>
                  <div className="mb-7">
                    <div className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Premium</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-5xl font-bold text-slate-900">35&euro;</span>
                      <span className="text-slate-400 text-sm">/mois</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Sans engagement · Annulable à tout moment</p>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-slate-900">299&euro;</span>
                          <span className="text-slate-400 text-xs">/an</span>
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">-29%</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-0.5">Soit 24,90&euro;/mois · 3 mois offerts + parrainage</p>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-7">
                    {[
                      'Toutes les régions anatomiques',
                      'Bibliothèque complète de tests',
                      'E-learning complet et quiz',
                      'Exercices et exports PDF',
                      'Revue de littérature mensuelle',
                      'Topographie clinique',
                      'MyOsteoFlow inclus (logiciel desktop)',
                      'Programme ambassadeur (10% · annuel)',
                    ].map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => router.push('/auth')}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 font-bold text-sm hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20"
                    >
                      Premium mensuel · 35&euro;/mois
                    </button>
                    <button
                      onClick={() => router.push('/auth')}
                      className="w-full py-3.5 rounded-xl border-2 border-amber-500 text-amber-700 font-semibold text-sm hover:bg-amber-500 hover:text-slate-900 transition-all"
                    >
                      Premium annuel · 299&euro;/an
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400">
                Mensuel ou annuel, sans engagement. Annulable à tout moment depuis votre compte.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section ref={cta.ref} className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b19] via-[#0c1528] to-[#0f172a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-sky-500/[0.06] blur-[150px]" />

        <div className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${
          cta.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            Tout le contenu en ligne
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
              pour 299&euro;/an.
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-4 max-w-lg mx-auto">
            200+ tests, e-learning complet, vidéos et bien plus.
            Le tout pour 35&euro;/mois ou 299&euro;/an.
          </p>
          <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto">
            Commence gratuitement avec le module épaule. Pas de carte bancaire.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="group bg-gradient-to-r from-sky-500 to-blue-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-sky-400 hover:to-blue-400 transition-all shadow-xl shadow-sky-500/20 hover:shadow-sky-500/30 inline-flex items-center gap-3"
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
