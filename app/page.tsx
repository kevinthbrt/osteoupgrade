'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import PublicFooter from '@/components/PublicFooter'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  Dumbbell,
  Gift,
  GraduationCap,
  Map,
  Menu,
  MessageSquare,
  Play,
  Shield,
  Sparkles,
  Stethoscope,
  TestTube2,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react'

type Feature = {
  title: string
  hook: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  screenshot: string
  bullets: string[]
}

const FEATURES: Feature[] = [
  {
    title: 'Tests orthopédiques',
    hook: 'Un doute sur un test à utiliser ?',
    description:
      'Accédez à plus de 200 tests avec sensibilité, spécificité, indications et démonstrations vidéo en quelques secondes.',
    icon: TestTube2,
    gradient: 'from-sky-500 to-blue-600',
    screenshot: '/landing/screenshots/tests.png',
    bullets: ['200+ tests', 'Sensi / Spéci', 'Vidéos', 'Recherche rapide'],
  },
  {
    title: 'Diagnostics & pathologies',
    hook: 'Un doute sur une pathologie ?',
    description:
      'Votre encyclopédie clinique avec red flags, signes clés et protocoles de prise en charge orientés cabinet.',
    icon: Stethoscope,
    gradient: 'from-rose-500 to-orange-500',
    screenshot: '/landing/screenshots/diagnostics.png',
    bullets: ['150+ pathologies', 'Red flags', 'Arbres décisionnels', 'Protocoles'],
  },
  {
    title: 'Topographie clinique',
    hook: 'Vous hésitez sur les structures impliquées ?',
    description:
      'Localisez la douleur, identifiez les structures probables et gagnez du temps dans votre raisonnement clinique.',
    icon: Map,
    gradient: 'from-indigo-500 to-cyan-500',
    screenshot: '/landing/screenshots/topographie.png',
    bullets: ['Vue par région', 'Structures', 'Raisonnement guidé', 'Décisions plus fiables'],
  },
  {
    title: 'E-learning & revues d’études',
    hook: 'Perdu dans la masse scientifique ?',
    description:
      'Cours structurés, revues mensuelles, quiz interactifs et contenu EBP prêt à appliquer dès demain.',
    icon: GraduationCap,
    gradient: 'from-violet-500 to-fuchsia-500',
    screenshot: '/landing/screenshots/elearning.png',
    bullets: ['500+ contenus', 'EBP mensuel', 'Quiz', 'Progression suivie'],
  },
  {
    title: 'Techniques vidéo',
    hook: 'Besoin de nouvelles techniques ?',
    description:
      'HVLA, mobilisations, tissulaire : des démonstrations claires pour une application immédiate au cabinet.',
    icon: Play,
    gradient: 'from-amber-500 to-red-500',
    screenshot: '/landing/screenshots/videos.png',
    bullets: ['150+ techniques', 'Par région', 'Formats courts', 'Applicables en séance'],
  },
  {
    title: 'Outils professionnels',
    hook: 'Envie d’optimiser votre cabinet ?',
    description:
      'Fiches exercices PDF, modèles de courriers et supports patients pour améliorer votre communication.',
    icon: Dumbbell,
    gradient: 'from-emerald-500 to-teal-500',
    screenshot: '/landing/screenshots/exercices.png',
    bullets: ['Fiches PDF', 'Modèles', 'Supports salle d’attente', 'Gain de temps'],
  },
]

const KPIS = [
  { label: 'Tests orthopédiques', value: '200+' },
  { label: 'Pathologies détaillées', value: '150+' },
  { label: 'Techniques en vidéo', value: '150+' },
  { label: 'Contenus e-learning', value: '500+' },
]

export default function LandingPage() {
  const router = useRouter()
  const [activeFeature, setActiveFeature] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const feature = useMemo(() => FEATURES[activeFeature], [activeFeature])
  const FeatureIcon = feature.icon

  return (
    <main className="overflow-x-hidden bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.2),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(244,63,94,0.16),transparent_30%)]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.2) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-lg font-bold">Osteo<span className="text-sky-400">Upgrade</span></button>
          <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <button onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}>Modules</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Abonnement</button>
            <button onClick={() => router.push('/auth')} className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-2 font-semibold">Essai gratuit</button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen((v) => !v)}>{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {mobileMenuOpen && (
          <div className="space-y-2 border-t border-white/10 px-4 py-4 md:hidden">
            <button className="block w-full rounded-lg bg-white/5 px-3 py-2 text-left" onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}>Modules</button>
            <button className="block w-full rounded-lg bg-white/5 px-3 py-2 text-left" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Abonnement</button>
            <button className="block w-full rounded-lg bg-sky-500 px-3 py-2 text-left font-semibold" onClick={() => router.push('/auth')}>Commencer</button>
          </div>
        )}
      </nav>

      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pt-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-300">
            <Sparkles className="h-3.5 w-3.5" /> Plateforme clinique nouvelle génération
          </div>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">Une landing page pensée pour <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">donner envie de s’abonner</span>.</h1>
          <p className="mt-6 max-w-xl text-lg text-slate-300">Tout votre contenu actuel est mis en scène dans une expérience plus premium, plus lisible et plus engageante.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button onClick={() => router.push('/auth')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-3 font-semibold shadow-lg shadow-sky-500/25">Démarrer l’essai <ArrowRight className="h-4 w-4" /></button>
            <button onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })} className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-slate-200">Voir les modules</button>
          </div>
          <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-400" /> Sans CB</span>
            <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-400" /> Résiliable à tout moment</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Accès immédiat</span>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-sky-500/35 via-fuchsia-500/25 to-cyan-500/35 blur-3xl" />
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-slate-900/70 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-slate-400">osteoupgrade.fr</span>
            </div>
            <div className="relative aspect-[16/10]">
              <Image src="/landing/screenshots/hero.png" alt="Aperçu de la plateforme OsteoUpgrade" fill className="object-cover object-top" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
            <p className="text-3xl font-black text-sky-300">{kpi.value}</p>
            <p className="mt-1 text-xs text-slate-300">{kpi.label}</p>
          </div>
        ))}
      </section>

      <section id="modules" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300"><Brain className="h-3.5 w-3.5" /> Votre contenu, mieux exposé</p>
          <h2 className="text-3xl font-black sm:text-4xl">Tout ce qui convainc un futur abonné.</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            {FEATURES.map((item, idx) => {
              const Icon = item.icon
              const active = idx === activeFeature
              return (
                <button
                  key={item.title}
                  onClick={() => setActiveFeature(idx)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${active ? 'border-sky-300/60 bg-sky-500/10 shadow-lg shadow-sky-900/30' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl bg-gradient-to-r ${item.gradient} p-2.5`}><Icon className="h-5 w-5" /></div>
                    <div>
                      <p className="text-xs text-slate-300">{item.hook}</p>
                      <p className="mt-1 font-semibold">{item.title}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="relative lg:col-span-3">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-sky-500/25 via-violet-500/20 to-cyan-500/25 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80">
              <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
                <div className={`rounded-xl bg-gradient-to-r ${feature.gradient} p-2.5`}><FeatureIcon className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-sm text-slate-300">{feature.description}</p>
                </div>
              </div>
              <div className="grid gap-5 p-6">
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
                  <Image src={feature.screenshot} alt={`Capture du module ${feature.title}`} fill className="object-cover object-top" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {feature.bullets.map((bullet) => (
                    <span key={bullet} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200">{bullet}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto mb-24 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-300/35 bg-gradient-to-br from-amber-400/15 via-slate-900 to-slate-950 p-8 sm:p-12">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200"><Trophy className="h-3.5 w-3.5" /> Offre Premium</p>
          <h3 className="text-3xl font-black sm:text-4xl">Un abonnement qui centralise tout.</h3>
          <p className="mt-3 max-w-2xl text-slate-300">E-learning, diagnostics, tests, techniques, outils pros et bonus OsteoFlow : une seule plateforme pour gagner du temps et progresser en continu.</p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { icon: Gift, text: 'Cashback parrainage' },
              { icon: MessageSquare, text: 'Messagerie patients' },
              { icon: Wallet, text: 'Comptabilité simplifiée' },
              { icon: Users, text: 'Dossiers patients' },
              { icon: BookOpen, text: 'Revue d’études mensuelle' },
              { icon: Zap, text: 'Progression gamifiée' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <Icon className="h-4 w-4 text-amber-300" />
                <span className="text-sm text-slate-200">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => router.push('/auth')} className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-bold text-slate-950">Je m’abonne maintenant</button>
            <button onClick={() => router.push('/auth')} className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-slate-200">Se connecter</button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
