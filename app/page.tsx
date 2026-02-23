'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Activity,
  HeartPulse,
  Trophy,
  Flame,
  Gift,
  Users,
  Wallet,
  Award,
  Zap,
  Target
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

// Mini mock UI for hero section
function MockAppUI() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Browser chrome */}
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0c1222]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0e1a] border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 rounded-md bg-white/5 text-[10px] text-white/40 font-mono">
              app.osteoupgrade.fr
            </div>
          </div>
        </div>

        {/* App content mock */}
        <div className="p-4 space-y-3">
          {/* Nav mock */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold text-white/90">
              Osteo<span className="text-amber-400">Upgrade</span>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-2 rounded bg-white/10" />
              <div className="w-16 h-2 rounded bg-white/10" />
              <div className="w-16 h-2 rounded bg-white/10" />
            </div>
          </div>

          {/* Region cards mock */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Epaule', color: 'from-blue-500/30 to-cyan-500/20', active: true },
              { label: 'Genou', color: 'from-emerald-500/30 to-teal-500/20', active: false },
              { label: 'Rachis', color: 'from-purple-500/30 to-pink-500/20', active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg p-2 text-center border ${
                  item.active
                    ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <div className={`w-6 h-6 rounded-md mx-auto mb-1 bg-gradient-to-br ${item.color}`} />
                <div className={`text-[9px] font-medium ${item.active ? 'text-amber-300' : 'text-white/50'}`}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Test list mock */}
          <div className="space-y-1.5">
            {['Test de Neer', 'Test de Jobe', 'Test de Speed'].map((test, i) => (
              <div
                key={test}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-amber-400' : 'bg-white/20'}`} />
                  <span className={`text-[10px] font-medium ${i === 0 ? 'text-amber-200' : 'text-white/50'}`}>
                    {test}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`text-[8px] px-1.5 py-0.5 rounded ${
                    i === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/30'
                  }`}>
                    Se: {85 + i * 3}%
                  </div>
                  <div className={`text-[8px] px-1.5 py-0.5 rounded ${
                    i === 0 ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/30'
                  }`}>
                    Sp: {78 + i * 5}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pathology card mock */}
          <div className="rounded-lg bg-gradient-to-r from-rose-500/10 to-rose-500/5 border border-rose-500/15 p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-4 h-4 rounded bg-rose-500/20 flex items-center justify-center">
                <Activity className="w-2.5 h-2.5 text-rose-400" />
              </div>
              <span className="text-[10px] font-semibold text-rose-300">Conflit sous-acromial</span>
              <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 ml-auto">Pathologie</span>
            </div>
            <div className="flex gap-1">
              <div className="h-1 flex-1 rounded-full bg-rose-500/30" />
              <div className="h-1 flex-[0.7] rounded-full bg-rose-500/15" />
              <div className="h-1 flex-[0.4] rounded-full bg-rose-500/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-4 -right-4 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-bold shadow-lg shadow-emerald-500/30 animate-float">
        +15 XP
      </div>
      <div className="absolute -bottom-3 -left-4 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-[10px] font-bold shadow-lg shadow-amber-500/30 animate-float-delayed">
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
  const modules = useScrollReveal()
  const gamification = useScrollReveal()
  const goldExperience = useScrollReveal()
  const pricing = useScrollReveal()
  const cta = useScrollReveal()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const featuresList = [
    {
      icon: TestTube2,
      title: 'Tests orthopediques',
      desc: 'Base de 200+ tests classes par region avec sensibilite, specificite et videos demonstratives.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Stethoscope,
      title: 'Diagnostics & Pathologies',
      desc: '150+ pathologies detaillees avec signes cliniques, red flags et tests associes.',
      gradient: 'from-rose-500 to-pink-500'
    },
    {
      icon: Map,
      title: 'Topographie clinique',
      desc: 'Guides topographiques pour structurer ton raisonnement region par region.',
      gradient: 'from-sky-500 to-indigo-500'
    },
    {
      icon: GraduationCap,
      title: 'E-Learning complet',
      desc: 'Cours structures, revue de litterature mensuelle et quiz pour valider tes connaissances.',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      icon: Play,
      title: 'Techniques en video',
      desc: '150+ videos de techniques (HVLA, mobilisation, tissulaire) organisees par region.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: Dumbbell,
      title: 'Exercices & Outils',
      desc: 'Bibliotheque d\'exercices, exports PDF, fiches patients et modeles de documents.',
      gradient: 'from-emerald-500 to-teal-500'
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-x-hidden">

      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <div className="text-xl font-bold tracking-tight">
              Osteo<span className="text-amber-500">Upgrade</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8">
              {[
                { label: 'Fonctionnalites', id: 'features' },
                { label: 'Modules', id: 'modules' },
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
                className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
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
              { label: 'Modules', id: 'modules' },
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
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/[0.05] blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-xs font-semibold mb-8 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Plateforme de reference pour osteopathes
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.08] mb-6 tracking-tight">
                Eleve ton
                <br />
                raisonnement
                <br />
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                  clinique.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed">
                Tests orthopediques, diagnostics, e-learning et outils pratiques.
                Tout ce dont tu as besoin pour exercer avec rigueur et confiance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={() => router.push('/auth')}
                  className="group bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 px-7 py-4 rounded-xl font-bold text-base hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center justify-center gap-2"
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => scrollTo('features')}
                  className="text-white/70 border border-white/15 px-7 py-4 rounded-xl font-semibold text-base hover:bg-white/5 hover:text-white hover:border-white/25 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  Decouvrir la plateforme
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Sans carte bancaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Module epaule complet</span>
                </div>
              </div>
            </div>

            {/* Right: Mock UI */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <MockAppUI />
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
              { value: 200, suffix: '+', label: 'Tests orthopediques', icon: TestTube2 },
              { value: 150, suffix: '+', label: 'Pathologies detaillees', icon: Stethoscope },
              { value: 150, suffix: '+', label: 'Videos techniques', icon: Play },
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
      <section id="features" ref={features.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${
            features.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              Fonctionnalites
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Tout pour ta pratique.
              <br />
              <span className="text-slate-400">Rien de superflu.</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Chaque outil a ete pense pour repondre a un besoin reel au cabinet.
              Du diagnostic a la prise en charge, structure ton approche clinique.
            </p>
          </div>

          {/* Bento grid */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-700 delay-200 ${
            features.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {featuresList.map((feature, i) => {
              const Icon = feature.icon
              const isActive = activeFeature === i
              return (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`group relative text-left rounded-2xl p-6 lg:p-8 transition-all duration-500 border ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-800 shadow-2xl shadow-slate-900/20 scale-[1.02]'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300 hover:shadow-lg'
                  } ${i === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 bg-gradient-to-br ${feature.gradient} ${
                    isActive ? 'shadow-lg' : 'opacity-90'
                  }`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className={`text-lg font-bold mb-2 ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {feature.title}
                  </h3>

                  <p className={`text-sm leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {feature.desc}
                  </p>

                  <div className={`mt-4 flex items-center gap-1 text-xs font-semibold transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-600'
                  }`}>
                    Explorer
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── WORKFLOW / HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-amber-500/[0.04] blur-[150px]" />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              Comment ca marche
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Simple. Rapide. Efficace.
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Pas de courbe d&apos;apprentissage. Tu ouvres, tu trouves, tu appliques.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Selectionne la region',
                desc: 'Choisis la zone anatomique correspondant a la plainte. Epaule, genou, rachis... chaque region a son univers dedie.',
                icon: Map,
                color: 'from-blue-500 to-cyan-500'
              },
              {
                step: '02',
                title: 'Explore le contenu',
                desc: 'Accede aux tests, pathologies, cours et videos. Structure ton raisonnement avec des donnees fiables et a jour.',
                icon: Brain,
                color: 'from-amber-500 to-orange-500'
              },
              {
                step: '03',
                title: 'Agis au cabinet',
                desc: 'Applique les techniques, genere des fiches exercices PDF et partage les supports avec tes patients.',
                icon: HeartPulse,
                color: 'from-emerald-500 to-teal-500'
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 hover:bg-white/[0.06] transition-all duration-300"
                >
                  {/* Step number */}
                  <div className="text-6xl font-black text-white/[0.04] absolute top-4 right-6">
                    {item.step}
                  </div>

                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} mb-6 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── MODULES SHOWCASE ─── */}
      <section id="modules" ref={modules.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${
            modules.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              Les modules
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Un ecosysteme complet
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Quatre piliers pour couvrir tous les aspects de ta pratique professionnelle.
            </p>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-all duration-700 delay-200 ${
            modules.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {[
              {
                title: 'Pratique',
                desc: 'Techniques osteopathiques en video organisees par region anatomique',
                icon: Stethoscope,
                gradient: 'from-rose-500 to-pink-600',
                bg: 'bg-rose-50',
                count: '150+ videos',
                tags: ['HVLA', 'Mobilisation', 'Tissulaire']
              },
              {
                title: 'E-Learning',
                desc: 'Cours, tests ortho, diagnostics, topographie et quiz interactifs',
                icon: GraduationCap,
                gradient: 'from-blue-500 to-indigo-600',
                bg: 'bg-blue-50',
                count: '500+ contenus',
                tags: ['Cours', 'Quiz', 'Revue']
              },
              {
                title: 'Outils',
                desc: 'Exercices therapeutiques et documents pratiques pour tes patients',
                icon: Dumbbell,
                gradient: 'from-orange-500 to-red-600',
                bg: 'bg-orange-50',
                count: '150+ exercices',
                tags: ['PDF', 'Fiches', 'Protocoles']
              },
              {
                title: 'Seminaires',
                desc: 'Formations presentielles pour approfondir tes competences manuelles',
                icon: Calendar,
                gradient: 'from-amber-500 to-orange-600',
                bg: 'bg-amber-50',
                count: 'Gold only',
                tags: ['Ateliers', 'Reseau', 'Live']
              },
            ].map((mod, i) => {
              const Icon = mod.icon
              return (
                <div
                  key={i}
                  className="group relative rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${mod.gradient} shadow-lg mb-5 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2">{mod.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">{mod.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {mod.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{mod.count}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── GAMIFICATION / REWARDS ─── */}
      <section ref={gamification.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-purple-500/[0.04] blur-[150px]" />

        <div className="max-w-7xl mx-auto relative">
          <div className={`text-center mb-16 transition-all duration-700 ${
            gamification.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              <Trophy className="h-3.5 w-3.5" />
              Systeme de recompenses
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Progresse. Debloque.
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Reste motive.
              </span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Chaque action sur la plateforme te fait gagner de l&apos;XP.
              Monte en niveau, debloque des badges et maintiens ta serie quotidienne.
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
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 w-[90%] transition-all" />
                  </div>
                  <div className="text-[10px] text-purple-400 mt-1">Plus que 50 XP pour le niveau 8</div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: Flame, label: 'Serie', value: '12 jours', color: 'text-orange-300', bg: 'bg-orange-500/15' },
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
                    Derniers badges debloques
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
                <div className="text-[9px] text-emerald-100">Cours termine !</div>
              </div>
            </div>

            {/* Right: Description */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Chaque effort compte
                </h3>
                <p className="text-slate-500 leading-relaxed">
                  Completer un cours, visionner une technique, consulter un diagnostic...
                  Chaque action sur la plateforme te rapporte de l&apos;XP et te fait progresser.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: Trophy,
                    title: 'Niveaux & XP',
                    desc: 'Gagne de l\'XP a chaque action. Monte en niveau et suis ta progression globale.',
                    color: 'from-amber-500 to-orange-500'
                  },
                  {
                    icon: Flame,
                    title: 'Series quotidiennes',
                    desc: 'Connecte-toi chaque jour pour maintenir ta serie et debloquer des bonus.',
                    color: 'from-orange-500 to-red-500'
                  },
                  {
                    icon: Award,
                    title: 'Badges exclusifs',
                    desc: 'Debloque des badges en atteignant des objectifs : premier cours, 10 tests, 30 jours...',
                    color: 'from-purple-500 to-indigo-500'
                  },
                  {
                    icon: Target,
                    title: 'Objectifs hebdo',
                    desc: 'Des objectifs chaque semaine pour rester engage et progresser regulierement.',
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

      {/* ─── GOLD EXPERIENCE: SEMINAIRES + AMBASSADEUR ─── */}
      <section ref={goldExperience.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c24] via-[#1a1035] to-[#0f172a]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/[0.06] blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/[0.05] blur-[120px]" />

        <div className="relative max-w-7xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${
            goldExperience.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 text-amber-400 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              <Crown className="h-3.5 w-3.5" />
              Experience Gold
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              Bien plus qu&apos;une app.
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                Un ecosysteme complet.
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              L&apos;abonnement Gold te donne acces aux formations presentielles
              et au programme ambassadeur avec commissions.
            </p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-700 delay-200 ${
            goldExperience.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>

            {/* SEMINAIRES CARD */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm overflow-hidden hover:bg-white/[0.06] transition-all group">
              {/* Header image area */}
              <div className="relative h-48 sm:h-56 bg-gradient-to-br from-amber-600/20 via-orange-600/15 to-rose-600/10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Seminar visual mock */}
                    <div className="w-64 h-36 rounded-xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-[10px] text-white/60">Prochain seminaire</div>
                          <div className="text-xs text-white font-bold">Rachis & Bassin</div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] text-white/50">
                          <Calendar className="h-3 w-3" />
                          <span>15-16 Mars 2025</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/50">
                          <Users className="h-3 w-3" />
                          <span>12 / 20 places</span>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <div className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[8px] font-medium">Pratique</div>
                        <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-medium">Inclus Gold</div>
                      </div>
                    </div>
                    {/* Floating elements */}
                    <div className="absolute -top-2 -right-6 px-2 py-1 rounded-lg bg-emerald-500 text-white text-[9px] font-bold shadow-lg animate-float">
                      2 jours intensifs
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Seminaires presentiels</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Des formations de 2 jours en petit groupe, encadrees par des praticiens experimentes.
                  Pratique manuelle intensive, cas cliniques et echanges entre confreres.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Users, label: 'Petits groupes', desc: '20 participants max' },
                    { icon: Stethoscope, label: 'Pratique intensive', desc: '80% de pratique manuelle' },
                    { icon: GraduationCap, label: 'Experts', desc: 'Intervenants specialises' },
                    { icon: Gift, label: 'Inclus Gold', desc: '1 seminaire/an compris' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="rounded-lg bg-white/5 border border-white/5 p-3">
                        <Icon className="h-4 w-4 text-amber-400 mb-1.5" />
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* PROGRAMME AMBASSADEUR CARD */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm overflow-hidden hover:bg-white/[0.06] transition-all group">
              {/* Header visual area */}
              <div className="relative h-48 sm:h-56 bg-gradient-to-br from-emerald-600/15 via-teal-600/10 to-cyan-600/10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Ambassador visual mock */}
                    <div className="w-64 h-36 rounded-xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                          <Crown className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="text-[10px] text-white/60">Espace Ambassadeur</div>
                          <div className="text-xs text-white font-bold">Ton tableau de bord</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="rounded bg-white/10 p-1.5 text-center">
                          <div className="text-sm font-bold text-emerald-300">5</div>
                          <div className="text-[8px] text-white/40">Filleuls</div>
                        </div>
                        <div className="rounded bg-white/10 p-1.5 text-center">
                          <div className="text-sm font-bold text-amber-300">25&euro;</div>
                          <div className="text-[8px] text-white/40">Cagnotte</div>
                        </div>
                        <div className="rounded bg-white/10 p-1.5 text-center">
                          <div className="text-sm font-bold text-cyan-300">10%</div>
                          <div className="text-[8px] text-white/40">Commission</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 font-mono text-[10px] text-amber-300 text-center">
                          OSTEO-KTHB
                        </div>
                        <div className="px-2 py-1 rounded bg-emerald-500/30 text-emerald-300 text-[8px] font-bold">
                          Copier
                        </div>
                      </div>
                    </div>
                    {/* Floating element */}
                    <div className="absolute -bottom-2 -left-6 px-2 py-1 rounded-lg bg-amber-500 text-white text-[9px] font-bold shadow-lg animate-float-delayed">
                      +5&euro; commission
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Programme Ambassadeur</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Parraine tes collegues et gagne 10% de commission sur chaque abonnement annuel.
                  Un code unique, un suivi en temps reel, et une cagnotte que tu peux retirer.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Gift, label: 'Code unique', desc: 'Ton code de parrainage perso' },
                    { icon: Wallet, label: '10% commission', desc: 'Sur chaque abonnement annuel' },
                    { icon: Users, label: 'Suivi en direct', desc: 'Filleuls et gains en temps reel' },
                    { icon: Crown, label: 'Exclusif Gold', desc: 'Reserve aux membres Gold' },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="rounded-lg bg-white/5 border border-white/5 p-3">
                        <Icon className="h-4 w-4 text-emerald-400 mb-1.5" />
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Gold CTA */}
          <div className={`mt-12 text-center transition-all duration-700 delay-400 ${
            goldExperience.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white/[0.04] border border-amber-500/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <div className="text-center sm:text-left">
                <div className="text-lg font-bold text-white mb-1">Tout ca des 499&euro;/an</div>
                <div className="text-sm text-slate-400">
                  Plateforme complete + 1 seminaire + programme ambassadeur
                </div>
              </div>
              <button
                onClick={() => scrollTo('pricing')}
                className="group bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 px-6 py-3 rounded-xl font-bold text-sm hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 whitespace-nowrap"
              >
                Voir les tarifs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl font-medium text-slate-700 mb-6 leading-relaxed italic">
            &ldquo;OsteoUpgrade m&apos;a permis de structurer mon raisonnement clinique des mes premiers mois d&apos;installation.
            Les tests orthopediques avec les donnees de sensibilite et specificite, c&apos;est exactement ce qui manquait.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
              O
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900">Osteopathe D.O.</div>
              <div className="text-xs text-slate-500">Utilisateur depuis 2024</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ─── */}
      <section id="pricing" ref={pricing.ref} className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${
            pricing.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              Tarifs
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Investis dans ta pratique.
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Des formules adaptees a chaque profil. Mensuel ou annuel, a toi de choisir.
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start transition-all duration-700 delay-200 ${
            pricing.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Free */}
            <div className="rounded-2xl bg-white border border-slate-200 p-8 hover:shadow-lg transition-all">
              <div className="mb-8">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Free</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-slate-900">0&euro;</span>
                  <span className="text-slate-400 text-sm">/an</span>
                </div>
                <p className="text-sm text-slate-500 mt-3">Decouvre la plateforme avec le module epaule complet.</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Module epaule complet',
                  'Tests orthopediques epaule',
                  'Diagnostics epaule',
                  'E-learning epaule',
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

            {/* Silver */}
            <div className="rounded-2xl bg-white border border-slate-200 p-8 hover:shadow-lg transition-all">
              <div className="mb-8">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Silver</div>

                {/* Monthly price */}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-bold text-slate-900">29&euro;</span>
                  <span className="text-slate-400 text-sm">/mois</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Sans engagement &middot; Annulable a tout moment</p>

                {/* Annual option */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-slate-900">240&euro;</span>
                      <span className="text-slate-400 text-xs">/an</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      -17%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Soit 20&euro;/mois &middot; 2 mois offerts</p>
                </div>

                <p className="text-sm text-slate-500 mt-4">Acces complet a toute la plateforme en ligne.</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Toutes les regions anatomiques',
                  'Bibliotheque complete de tests',
                  'Tous les diagnostics & pathologies',
                  'E-learning complet + quiz',
                  'Exercices + exports PDF',
                  'Revue de litterature mensuelle',
                  'Topographie clinique',
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-slate-900 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="space-y-2.5">
                <button
                  onClick={() => router.push('/auth')}
                  className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all shadow-sm"
                >
                  Silver mensuel &middot; 29&euro;/mois
                </button>
                <button
                  onClick={() => router.push('/auth')}
                  className="w-full py-3.5 rounded-xl border-2 border-slate-900 text-slate-900 font-semibold text-sm hover:bg-slate-900 hover:text-white transition-all"
                >
                  Silver annuel &middot; 240&euro;/an
                </button>
              </div>
            </div>

            {/* Gold */}
            <div className="rounded-2xl relative overflow-hidden">
              {/* Gold border effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-2xl" />
              <div className="absolute inset-[2px] bg-white rounded-[14px]" />

              <div className="relative p-8">
                {/* Badge */}
                <div className="absolute top-6 right-6">
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                    <Crown className="h-3.5 w-3.5" />
                    Populaire
                  </div>
                </div>

                <div className="mb-8">
                  <div className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-2">Gold</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-slate-900">499&euro;</span>
                    <span className="text-slate-400 text-sm">/an</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Soit 41,58&euro;/mois &middot; Acces annuel complet</p>
                  <p className="text-sm text-slate-500 mt-3">L&apos;experience complete : en ligne + presentiel.</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {[
                    'Tout ce qui est dans Silver',
                    'Seminaires presentiels (2 jours)',
                    'Masterclass exclusives',
                    'Programme ambassadeur (10% commission)',
                    'Acces prioritaire aux nouveautes',
                    'Support premium dedie',
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push('/auth')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 font-bold text-sm hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/20"
                >
                  Choisir Gold &middot; 499&euro;/an
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-sm text-slate-400">
            Silver disponible en mensuel ou annuel. Gold en abonnement annuel. Sans engagement au-dela.
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section ref={cta.ref} className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#070b19] via-[#0c1528] to-[#0f172a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/[0.06] blur-[150px]" />

        <div className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${
          cta.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            Pret a passer au
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              niveau superieur ?
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-lg mx-auto">
            Teste gratuitement avec le module epaule complet.
            Pas de carte bancaire. Pas d&apos;engagement.
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="group bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 px-10 py-4 rounded-xl font-bold text-lg hover:from-amber-400 hover:to-amber-300 transition-all shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 inline-flex items-center gap-3"
          >
            Commencer maintenant
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white border-t border-slate-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="text-xl font-bold text-slate-900 mb-4">
                Osteo<span className="text-amber-500">Upgrade</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                La plateforme de reference pour structurer ton raisonnement clinique.
                Developpee par des osteopathes, pour des osteopathes.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Produit</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Fonctionnalites', href: '#features' },
                  { label: 'Modules', href: '#modules' },
                  { label: 'Tarifs', href: '#pricing' },
                  { label: 'Essai gratuit', href: '/auth' },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Ressources</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'E-Learning', href: '/auth' },
                  { label: 'Seminaires', href: '/auth' },
                  { label: 'Revue mensuelle', href: '/auth' },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Mentions legales', href: '/mentions-legales' },
                  { label: 'Confidentialite', href: '/politique-confidentialite' },
                  { label: 'CGU', href: '/cgu' },
                  { label: 'Contact', href: 'mailto:privacy@osteo-upgrade.fr' },
                ].map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} OsteoUpgrade. Tous droits reserves.
            </div>
            <div className="text-sm text-slate-400">
              Fait avec rigueur, pour des praticiens exigeants.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
