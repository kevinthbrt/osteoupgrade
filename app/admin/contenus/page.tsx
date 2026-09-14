'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import UsageContenusClient from '@/components/UsageContenusClient'
import { planLabel, type Plan } from '@/lib/entitlements'
import {
  Library,
  GraduationCap,
  Video,
  Stethoscope,
  Layers,
  HelpCircle,
  Users,
  Moon,
  Flame,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Search,
  Award,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'

// ── Types renvoyés par /api/admin/content-usage ──────────────────────────────

type Couverture = { cle: string; label: string; catalogue: number; utilises: number; dormants: number; part: number }
type Famille = { cle: string; label: string; actions30: number; actionsTotal: number; apprenants30: number; derniereActivite: string | null }
type Jour = { date: string; elearning: number; quiz: number; pratique: number; tests: number; flashcards: number }
type FormationLigne = {
  id: string; titre: string; sujet: string | null; couleurSujet: string | null
  chapitres: number; sousParties: number; apprenants: number; completions: number
  avancementMoyen: number; termine: number; certificats: number
  derniereActivite: string | null; privee: boolean; gratuite: boolean
}
type ChapitreLigne = { id: string; formationId: string; titre: string; ordre: number; sousParties: number; apprenants: number; completions: number }
type SousPartieDormante = { id: string; titre: string; chapitre: string; formation: string; video: boolean; pdf: boolean }
type QuizLigne = {
  id: string; titre: string; sousPartie: string | null; formation: string | null; actif: boolean
  tentatives: number; apprenants: number; reussite: number | null; scoreMoyen: number | null; derniereActivite: string | null
}
type VideoLigne = { id: string; titre: string; categorie: string | null; couleur: string | null; region: string | null; vues: number; apprenants: number; derniereActivite: string | null; gratuite: boolean }
type Groupe = { nom: string; vues: number; contenus: number; utilises: number; apprenants: number; couleur: string | null }
type TestLigne = { id: string; titre: string; categorie: string | null; vues: number; apprenants: number }
type PaquetLigne = {
  id: string; titre: string; theme: string | null; cartes: number; cartesTravaillees: number
  apprenants: number; revisions: number; noteMoyenne: number | null; oubliees: number; certificats: number; derniereActivite: string | null
}
type Membre = {
  id: string; nom: string | null; email: string | null; role: string | null; offre: string
  actions30: number; actionsTotal: number; derniereActivite: string | null
  elearning: number; quiz: number; pratique: number; tests: number; flashcards: number
}

type Usage = {
  perimetre: { inclureAdmins: boolean; comptes: number; comptesTotal: number; admins: number; actifs30: number }
  couverture: Couverture[]
  familles: Famille[]
  timeline: Jour[]
  elearning: { formations: FormationLigne[]; chapitres: ChapitreLigne[]; dormantes: SousPartieDormante[]; apprenants: number; completions: number; certificats: number }
  quiz: { lignes: QuizLigne[]; tentatives: number; apprenants: number; reussite: number; jamaisTentes: number }
  pratique: { parCategorie: Groupe[]; parRegion: Groupe[]; vues: VideoLigne[]; dormantes: VideoLigne[]; total: number; vuesTotal: number; apprenants: number }
  tests: { suivi: boolean; dernierEnregistrement: string | null; vus: TestLigne[]; dormants: number; total: number; vuesTotal: number; apprenants: number }
  flashcards: { paquets: PaquetLigne[]; revisions: number; apprenants: number; cartes: number; cartesTravaillees: number; certificats: number }
  membres: Membre[]
  sansSuivi: { label: string; catalogue: number; note: string }[]
  generatedAt: string
}

const FAMILLES: Record<string, { couleur: string; classe: string }> = {
  elearning:  { couleur: '#6366f1', classe: 'bg-indigo-500' },
  quiz:       { couleur: '#a855f7', classe: 'bg-purple-500' },
  pratique:   { couleur: '#0ea5e9', classe: 'bg-sky-500' },
  tests:      { couleur: '#f59e0b', classe: 'bg-amber-500' },
  flashcards: { couleur: '#10b981', classe: 'bg-emerald-500' },
}

function fmtDate(d: string | null): string {
  if (!d) return 'jamais'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}
function fmtJour(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// ── Briques d’affichage ──────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, iconColor, iconBg }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: React.ReactNode
  iconColor: string
  iconBg: string
}) {
  return (
    <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-lg ring-1 ring-inset ring-white/60 p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        </div>
      </div>
      {sub && <div className="mt-2 text-xs">{sub}</div>}
    </div>
  )
}

function SectionCard({ title, accent, icon: Icon, subtitle, action, children }: {
  title: string
  accent: string
  icon?: React.ComponentType<{ className?: string }>
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`h-5 w-1 rounded-full bg-gradient-to-b ${accent}`} />
          {Icon && <Icon className="h-4 w-4 text-slate-500" />}
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-wide">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Barre « utilisé / dormant » : la part grise est le message principal. */
function BarreCouverture({ ligne }: { ligne: Couverture }) {
  return (
    <div className="flex items-center gap-3" title={`${ligne.utilises} contenus utilisés sur ${ligne.catalogue}`}>
      <div className="w-44 shrink-0 text-xs font-medium text-slate-600 truncate">{ligne.label}</div>
      <div className="flex-1 h-6 rounded-lg bg-slate-200 overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-end pr-1.5"
          style={{ width: `${Math.max(ligne.part, 0)}%` }}
        >
          {ligne.part >= 18 && <span className="text-[10px] font-bold text-white">{ligne.part}%</span>}
        </div>
      </div>
      <div className="w-40 shrink-0 text-right text-xs text-slate-600 tabular-nums">
        <span className="font-semibold">{ligne.utilises}</span>
        <span className="text-slate-400">/{ligne.catalogue}</span>
        {ligne.dormants > 0 && <span className="text-slate-400"> · {ligne.dormants} dormants</span>}
      </div>
    </div>
  )
}

function HBars({ rows, couleur }: { rows: { label: string; value: number; hint?: string }[]; couleur: string }) {
  if (!rows.length) return <p className="text-sm text-slate-400">Aucune donnée.</p>
  const max = Math.max(...rows.map(r => r.value), 1)
  const sum = rows.reduce((s, r) => s + r.value, 0)
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3" title={`${r.label} : ${r.value}${r.hint ? ` · ${r.hint}` : ''}`}>
          <div className="w-40 shrink-0 text-xs font-medium text-slate-600 truncate">{r.label}</div>
          <div className="flex-1 h-6 rounded-lg bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-lg ${couleur}`} style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value > 0 ? '6px' : 0 }} />
          </div>
          <div className="w-32 shrink-0 text-right text-xs font-semibold text-slate-700 tabular-nums">
            {r.value.toLocaleString('fr-FR')}
            {sum > 0 && <span className="text-slate-400 font-normal"> · {Math.round((r.value / sum) * 100)}%</span>}
            {r.hint && <span className="text-slate-400 font-normal block text-[10px] leading-tight">{r.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Chronologie empilée : une colonne par jour, une couleur par famille. */
function Chronologie({ data }: { data: Jour[] }) {
  const W = 760, H = 220, PAD_L = 34, PAD_R = 12, PAD_T = 12, PAD_B = 26
  const cles: (keyof Jour)[] = ['elearning', 'quiz', 'pratique', 'tests', 'flashcards']
  const totaux = data.map(d => cles.reduce((s, k) => s + (d[k] as number), 0))
  const max = Math.max(...totaux, 1)
  if (!data.length) return null
  const iw = W - PAD_L - PAD_R
  const ih = H - PAD_T - PAD_B
  const bw = iw / data.length
  const ticks = [0, 1, 2, 3].map(i => Math.round((max * i) / 3))
  const labelEvery = Math.ceil(data.length / 8)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Actions sur les contenus par jour">
      {ticks.map((t, i) => {
        const yy = PAD_T + ih - (t / max) * ih
        return (
          <g key={i}>
            <line x1={PAD_L} y1={yy} x2={W - PAD_R} y2={yy} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD_L - 6} y={yy + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{t}</text>
          </g>
        )
      })}
      {data.map((d, i) => {
        let cumul = 0
        const total = cles.reduce((s, k) => s + (d[k] as number), 0)
        return (
          <g key={d.date}>
            {cles.map(k => {
              const v = d[k] as number
              if (v <= 0) return null
              const h = (v / max) * ih
              const y = PAD_T + ih - ((cumul + v) / max) * ih
              cumul += v
              return (
                <rect key={String(k)} x={PAD_L + i * bw + bw * 0.12} y={y} width={bw * 0.76} height={Math.max(h, 1)} fill={FAMILLES[String(k)].couleur}>
                  <title>{`${fmtJour(d.date)} : ${total} action${total > 1 ? 's' : ''}`}</title>
                </rect>
              )
            })}
            {i % labelEvery === 0 && (
              <text x={PAD_L + i * bw + bw / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">{fmtJour(d.date)}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function Jauge({ valeur, couleur = 'bg-indigo-500' }: { valeur: number; couleur?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
      <div className={`h-full rounded-full ${couleur}`} style={{ width: `${Math.min(Math.max(valeur, 0), 100)}%` }} />
    </div>
  )
}

function Repli({ label, compte, children }: { label: string; compte: number; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false)
  if (compte === 0) return null
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70">
      <button
        onClick={() => setOuvert(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-slate-600 hover:text-slate-900"
      >
        {ouvert ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Moon className="h-3.5 w-3.5 text-slate-400" />
        {label} ({compte})
      </button>
      {ouvert && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminContenusPage() {
  const router = useRouter()
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inclureAdmins, setInclureAdmins] = useState(false)
  const [formationOuverte, setFormationOuverte] = useState<string | null>(null)
  const [rafraichir, setRafraichir] = useState(0)
  const [recherche, setRecherche] = useState('')
  const [clientOuvert, setClientOuvert] = useState<string | null>(null)
  const [toutVoir, setToutVoir] = useState(false)

  useEffect(() => {
    let annule = false
    const charger = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role !== 'admin') { router.push('/dashboard'); return }

        const res = await fetch(`/api/admin/content-usage?admins=${inclureAdmins ? 'inclus' : 'exclus'}`)
        if (!res.ok) throw new Error("Impossible de charger l’usage des contenus")
        const data = await res.json()
        if (!annule) setUsage(data)
      } catch (e: any) {
        if (!annule) setError(e.message || 'Erreur')
      } finally {
        if (!annule) setLoading(false)
      }
    }
    charger()
    return () => { annule = true }
  }, [router, inclureAdmins, rafraichir])

  // Vue d’ensemble : combien de contenus dorment, tous formats confondus.
  const synthese = useMemo(() => {
    if (!usage) return null
    const catalogue = usage.couverture.reduce((s, c) => s + c.catalogue, 0)
    const utilises = usage.couverture.reduce((s, c) => s + c.utilises, 0)
    const actions30 = usage.familles.reduce((s, f) => s + f.actions30, 0)
    const actionsTotal = usage.familles.reduce((s, f) => s + f.actionsTotal, 0)
    return {
      catalogue,
      utilises,
      dormants: catalogue - utilises,
      part: catalogue > 0 ? Math.round((utilises / catalogue) * 100) : 0,
      actions30,
      actionsTotal,
    }
  }, [usage])

  const chapitresFormation = useMemo(() => {
    if (!usage || !formationOuverte) return []
    return usage.elearning.chapitres.filter(c => c.formationId === formationOuverte)
  }, [usage, formationOuverte])

  const membresAffiches = useMemo(() => {
    if (!usage) return []
    const q = recherche.trim().toLowerCase()
    if (q) {
      return usage.membres.filter(m =>
        (m.nom || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)
      )
    }
    return toutVoir ? usage.membres : usage.membres.slice(0, 12)
  }, [usage, recherche, toutVoir])

  const quizFragiles = useMemo(() => {
    if (!usage) return []
    return usage.quiz.lignes
      .filter(q => q.tentatives >= 3 && q.reussite !== null && q.reussite < 60)
      .sort((a, b) => (a.reussite ?? 0) - (b.reussite ?? 0))
      .slice(0, 8)
  }, [usage])

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="relative">
            <AdminBackButton />
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-sky-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                <Library className="h-4 w-4" /> Contenus
              </p>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-blue-200 bg-clip-text text-transparent">
                    Usage des contenus
                  </h1>
                  <p className="text-blue-300/70 text-sm mt-1.5">
                    Ce que les clients consultent, où ils en sont dans les cours, et ce qui ne sert jamais
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInclureAdmins(v => !v)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      inclureAdmins
                        ? 'bg-amber-400/20 border-amber-300/40 text-amber-100'
                        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    {inclureAdmins ? 'Comptes admin inclus' : 'Comptes admin exclus'}
                  </button>
                  <button
                    onClick={() => setRafraichir(n => n + 1)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </button>
                </div>
              </div>
              {usage && (
                <p className="text-blue-300/60 text-xs mt-3">
                  Mesuré sur {usage.perimetre.comptes} compte{usage.perimetre.comptes > 1 ? 's' : ''}
                  {!usage.perimetre.inclureAdmins && usage.perimetre.admins > 0 && ` (${usage.perimetre.admins} compte${usage.perimetre.admins > 1 ? 's' : ''} admin mis de côté)`}
                  {' · '}données du {new Date(usage.generatedAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" />
        </div>

        {/* BODY */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10 min-h-[60vh]">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-blue-400/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />

          <div className="relative space-y-6">
            {loading && <div className="py-24 text-center text-slate-500 text-sm">Chargement de l’usage des contenus…</div>}
            {error && !loading && <div className="rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">{error}</div>}

            {usage && synthese && !loading && (
              <>
                {/* ═══ VUE D’ENSEMBLE ═══ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KpiCard
                    icon={Library} label="Catalogue mesuré" value={synthese.catalogue}
                    iconColor="text-blue-600" iconBg="bg-blue-100"
                    sub={<span className="text-slate-400">cours, quiz, vidéos, tests, cartes</span>}
                  />
                  <KpiCard
                    icon={Flame} label="Contenus déjà utilisés" value={`${synthese.part}%`}
                    iconColor="text-emerald-600" iconBg="bg-emerald-100"
                    sub={<span className="text-slate-400">{synthese.utilises} contenus ouverts au moins une fois</span>}
                  />
                  <KpiCard
                    icon={Moon} label="Contenus dormants" value={synthese.dormants}
                    iconColor="text-slate-600" iconBg="bg-slate-200"
                    sub={<span className="text-slate-400">jamais ouverts par un client</span>}
                  />
                  <KpiCard
                    icon={Users} label="Actions sur 30 jours" value={synthese.actions30}
                    iconColor="text-violet-600" iconBg="bg-violet-100"
                    sub={<span className="text-slate-400">{usage.perimetre.actifs30} client{usage.perimetre.actifs30 > 1 ? 's' : ''} actif{usage.perimetre.actifs30 > 1 ? 's' : ''} · {synthese.actionsTotal.toLocaleString('fr-FR')} au total</span>}
                  />
                </div>

                {/* ═══ COUVERTURE ═══ */}
                <SectionCard
                  title="Couverture du catalogue"
                  subtitle="Part de chaque rubrique réellement consultée au moins une fois"
                  accent="from-emerald-400 to-emerald-600"
                  icon={Library}
                >
                  <div className="space-y-2.5">
                    {usage.couverture.map(c => <BarreCouverture key={c.cle} ligne={c} />)}
                  </div>
                </SectionCard>

                {/* ═══ CE QUI TOURNE ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SectionCard
                    title="Ce qui est utilisé (30 jours)"
                    subtitle="Nombre d’actions par rubrique, et clients distincts derrière"
                    accent="from-violet-400 to-violet-600"
                    icon={Flame}
                  >
                    <HBars
                      couleur="bg-violet-500"
                      rows={usage.familles.map(f => ({
                        label: f.label,
                        value: f.actions30,
                        hint: `${f.apprenants30} client${f.apprenants30 > 1 ? 's' : ''} · dernier ${fmtDate(f.derniereActivite)}`,
                      }))}
                    />
                  </SectionCard>

                  <SectionCard
                    title="Volume total par rubrique"
                    subtitle="Depuis l’ouverture, pour relativiser les 30 derniers jours"
                    accent="from-sky-400 to-sky-600"
                    icon={Layers}
                  >
                    <HBars
                      couleur="bg-sky-500"
                      rows={usage.familles.map(f => ({ label: f.label, value: f.actionsTotal }))}
                    />
                  </SectionCard>
                </div>

                {/* ═══ CHRONOLOGIE ═══ */}
                <SectionCard
                  title="Activité sur les contenus (90 jours)"
                  subtitle="Une colonne par jour, une couleur par rubrique"
                  accent="from-indigo-400 to-indigo-600"
                  icon={Layers}
                >
                  <Chronologie data={usage.timeline} />
                  <div className="flex flex-wrap gap-4 mt-3">
                    {usage.familles.map(f => (
                      <div key={f.cle} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: FAMILLES[f.cle].couleur }} />
                        {f.label}
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* ═══ E-LEARNING ═══ */}
                <SectionCard
                  title="Avancement des cours"
                  subtitle="Cliquez une formation pour voir le décrochage chapitre par chapitre"
                  accent="from-indigo-400 to-indigo-600"
                  icon={GraduationCap}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200">
                          <th className="text-left font-semibold py-2 pr-3">Formation</th>
                          <th className="text-right font-semibold py-2 px-2">Clients</th>
                          <th className="text-left font-semibold py-2 px-2 w-40">Avancement moyen</th>
                          <th className="text-right font-semibold py-2 px-2">Terminée</th>
                          <th className="text-right font-semibold py-2 px-2">Certificats</th>
                          <th className="text-right font-semibold py-2 pl-2">Dernière activité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage.elearning.formations.map(f => (
                          <tr
                            key={f.id}
                            onClick={() => setFormationOuverte(o => (o === f.id ? null : f.id))}
                            className={`border-b border-slate-100 cursor-pointer hover:bg-indigo-50/50 ${formationOuverte === f.id ? 'bg-indigo-50/70' : ''}`}
                          >
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2">
                                {formationOuverte === f.id ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-800 truncate">{f.titre}</p>
                                  <p className="text-[11px] text-slate-400">
                                    {f.chapitres} chapitre{f.chapitres > 1 ? 's' : ''} · {f.sousParties} sous-partie{f.sousParties > 1 ? 's' : ''}
                                    {f.gratuite && ' · accès libre'}
                                    {f.privee && ' · privée'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right font-semibold text-slate-700 tabular-nums">{f.apprenants}</td>
                            <td className="py-2.5 px-2">
                              <div className="flex items-center gap-2">
                                <Jauge valeur={f.avancementMoyen} />
                                <span className="text-xs font-semibold text-slate-600 tabular-nums w-9 text-right">{f.avancementMoyen}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right text-slate-600 tabular-nums">{f.termine}</td>
                            <td className="py-2.5 px-2 text-right text-slate-600 tabular-nums">{f.certificats}</td>
                            <td className="py-2.5 pl-2 text-right text-xs text-slate-500">{fmtDate(f.derniereActivite)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {formationOuverte && (
                    <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <h3 className="text-xs font-bold text-slate-700 mb-3">
                        Décrochage par chapitre : {usage.elearning.formations.find(f => f.id === formationOuverte)?.titre}
                      </h3>
                      {chapitresFormation.length === 0 ? (
                        <p className="text-sm text-slate-400">Cette formation n’a pas encore de chapitre.</p>
                      ) : (
                        <HBars
                          couleur="bg-indigo-500"
                          rows={chapitresFormation.map(c => ({
                            label: c.titre,
                            value: c.apprenants,
                            hint: `${c.completions} validation${c.completions > 1 ? 's' : ''} sur ${c.sousParties} sous-partie${c.sousParties > 1 ? 's' : ''}`,
                          }))}
                        />
                      )}
                      <p className="text-[11px] text-slate-500 mt-3">
                        La barre compte les clients distincts ayant validé au moins une sous-partie du chapitre : une
                        marche descendante marque l’endroit où ils s’arrêtent.
                      </p>
                    </div>
                  )}

                  <Repli label="Sous-parties jamais terminées" compte={usage.elearning.dormantes.length}>
                    <ul className="space-y-1.5 text-xs text-slate-600 max-h-80 overflow-y-auto">
                      {usage.elearning.dormantes.map(sp => (
                        <li key={sp.id} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                          <span>
                            <span className="font-medium text-slate-700">{sp.titre}</span>
                            <span className="text-slate-400"> · {sp.formation} / {sp.chapitre}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Repli>
                </SectionCard>

                {/* ═══ QUIZ ═══ */}
                <SectionCard
                  title="Quiz"
                  subtitle={`${usage.quiz.tentatives} tentatives · ${usage.quiz.reussite}% de réussite · ${usage.quiz.jamaisTentes} quiz jamais tentés`}
                  accent="from-purple-400 to-purple-600"
                  icon={HelpCircle}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-600 mb-3">Les plus joués</h3>
                      <HBars
                        couleur="bg-purple-500"
                        rows={usage.quiz.lignes.filter(q => q.tentatives > 0).slice(0, 10).map(q => ({
                          label: q.titre,
                          value: q.tentatives,
                          hint: `${q.apprenants} client${q.apprenants > 1 ? 's' : ''}${q.reussite !== null ? ` · ${q.reussite}% réussite` : ''}`,
                        }))}
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-600 mb-3">
                        Les plus ratés
                        <span className="font-normal text-slate-400"> (moins de 60% de réussite, 3 tentatives minimum)</span>
                      </h3>
                      {quizFragiles.length === 0 ? (
                        <p className="text-sm text-slate-400">Aucun quiz ne bloque les clients pour l’instant.</p>
                      ) : (
                        <div className="space-y-2">
                          {quizFragiles.map(q => (
                            <div key={q.id} className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-medium text-slate-700 truncate">{q.titre}</p>
                                <span className="text-xs font-bold text-amber-700 tabular-nums shrink-0">{q.reussite}%</span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {q.formation ? `${q.formation} · ` : ''}{q.tentatives} tentatives · score moyen {q.scoreMoyen ?? '?'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Repli label="Quiz jamais tentés" compte={usage.quiz.lignes.filter(q => q.actif && q.tentatives === 0).length}>
                    <ul className="space-y-1.5 text-xs text-slate-600 max-h-72 overflow-y-auto">
                      {usage.quiz.lignes.filter(q => q.actif && q.tentatives === 0).map(q => (
                        <li key={q.id} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                          <span>
                            <span className="font-medium text-slate-700">{q.titre}</span>
                            {q.formation && <span className="text-slate-400"> · {q.formation}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Repli>
                </SectionCard>

                {/* ═══ PRATIQUE ═══ */}
                <SectionCard
                  title="Vidéos de pratique"
                  subtitle={`${usage.pratique.vuesTotal} visionnages · ${usage.pratique.apprenants} clients · ${usage.pratique.dormantes.length} vidéos jamais ouvertes sur ${usage.pratique.total}`}
                  accent="from-sky-400 to-sky-600"
                  icon={Video}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-600 mb-3">Par catégorie de technique</h3>
                      <HBars
                        couleur="bg-sky-500"
                        rows={usage.pratique.parCategorie.map(c => ({
                          label: c.nom,
                          value: c.vues,
                          hint: `${c.utilises}/${c.contenus} vidéos vues · ${c.apprenants} client${c.apprenants > 1 ? 's' : ''}`,
                        }))}
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-600 mb-3">Par région du corps</h3>
                      <HBars
                        couleur="bg-cyan-500"
                        rows={usage.pratique.parRegion.map(c => ({
                          label: c.nom,
                          value: c.vues,
                          hint: `${c.utilises}/${c.contenus} vidéos vues`,
                        }))}
                      />
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-600 mt-6 mb-3">Les vidéos les plus regardées</h3>
                  <HBars
                    couleur="bg-blue-500"
                    rows={usage.pratique.vues.slice(0, 12).map(v => ({
                      label: v.titre,
                      value: v.vues,
                      hint: `${v.apprenants} client${v.apprenants > 1 ? 's' : ''}${v.categorie ? ` · ${v.categorie}` : ''}`,
                    }))}
                  />

                  <Repli label="Vidéos jamais ouvertes" compte={usage.pratique.dormantes.length}>
                    <ul className="space-y-1.5 text-xs text-slate-600 max-h-80 overflow-y-auto">
                      {usage.pratique.dormantes.map(v => (
                        <li key={v.id} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                          <span>
                            <span className="font-medium text-slate-700">{v.titre}</span>
                            <span className="text-slate-400">
                              {v.categorie ? ` · ${v.categorie}` : ''}{v.region ? ` · ${v.region}` : ''}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Repli>
                </SectionCard>

                {/* ═══ TESTS ET FLASHCARDS ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SectionCard
                    title="Tests orthopédiques"
                    subtitle={usage.tests.suivi
                      ? `${usage.tests.vuesTotal} consultations · ${usage.tests.dormants} tests jamais ouverts sur ${usage.tests.total}`
                      : `${usage.tests.total} tests au catalogue, consultation non mesurée`}
                    accent="from-amber-400 to-amber-600"
                    icon={Stethoscope}
                  >
                    {!usage.tests.suivi ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-slate-600 space-y-1.5">
                        <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5" /> Suivi à l’arrêt
                        </p>
                        <p>
                          Plus aucune application n’enregistre la consultation d’un test orthopédique
                          {usage.tests.dernierEnregistrement
                            ? ` (dernière trace le ${fmtDate(usage.tests.dernierEnregistrement)})`
                            : ''}.
                          Le zéro affiché ici mesure le trou de suivi, pas le désintérêt des clients : ces
                          {' '}{usage.tests.total} tests sont donc sortis du calcul de couverture.
                        </p>
                      </div>
                    ) : usage.tests.vus.length === 0 ? (
                      <p className="text-sm text-slate-400">Aucun test consulté sur ce périmètre.</p>
                    ) : (
                      <HBars
                        couleur="bg-amber-500"
                        rows={usage.tests.vus.slice(0, 12).map(t => ({
                          label: t.titre,
                          value: t.vues,
                          hint: `${t.apprenants} client${t.apprenants > 1 ? 's' : ''}${t.categorie ? ` · ${t.categorie}` : ''}`,
                        }))}
                      />
                    )}
                  </SectionCard>

                  <SectionCard
                    title="Flashcards"
                    subtitle={`${usage.flashcards.revisions} révisions · ${usage.flashcards.cartesTravaillees}/${usage.flashcards.cartes} cartes travaillées`}
                    accent="from-emerald-400 to-emerald-600"
                    icon={Layers}
                  >
                    <div className="space-y-3">
                      {usage.flashcards.paquets.map(p => (
                        <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800 truncate">{p.titre}</p>
                            <span className="text-xs text-slate-500 shrink-0 tabular-nums">
                              {p.apprenants} client{p.apprenants > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Jauge valeur={p.cartes > 0 ? (p.cartesTravaillees / p.cartes) * 100 : 0} couleur="bg-emerald-500" />
                            <span className="text-[11px] text-slate-500 tabular-nums w-20 text-right">
                              {p.cartesTravaillees}/{p.cartes} cartes
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            {p.revisions} révisions · note moyenne {p.noteMoyenne ?? '?'}/4 · {p.oubliees} carte{p.oubliees > 1 ? 's' : ''} oubliée{p.oubliees > 1 ? 's' : ''}
                            {p.certificats > 0 && ` · ${p.certificats} certificat${p.certificats > 1 ? 's' : ''}`}
                          </p>
                        </div>
                      ))}
                      {usage.flashcards.paquets.length === 0 && <p className="text-sm text-slate-400">Aucun paquet.</p>}
                    </div>
                  </SectionCard>
                </div>

                {/* ═══ MEMBRES ═══ */}
                <SectionCard
                  title="Activité par client"
                  subtitle="Cliquez une ligne pour voir son avancement détaillé"
                  accent="from-blue-400 to-blue-600"
                  icon={Users}
                  action={
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        value={recherche}
                        onChange={e => setRecherche(e.target.value)}
                        placeholder="Rechercher un client"
                        className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs w-52 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  }
                >
                  {membresAffiches.length === 0 ? (
                    <p className="text-sm text-slate-400">Aucun client ne correspond.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200">
                            <th className="text-left font-semibold py-2 pr-3">Client</th>
                            <th className="text-right font-semibold py-2 px-2">30 j</th>
                            <th className="text-right font-semibold py-2 px-2">Total</th>
                            <th className="text-right font-semibold py-2 px-2">Cours</th>
                            <th className="text-right font-semibold py-2 px-2">Quiz</th>
                            <th className="text-right font-semibold py-2 px-2">Pratique</th>
                            <th className="text-right font-semibold py-2 px-2">Flashcards</th>
                            <th className="text-right font-semibold py-2 pl-2">Dernière action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {membresAffiches.map(m => (
                            <Fragment key={m.id}>
                              <tr
                                onClick={() => setClientOuvert(o => (o === m.id ? null : m.id))}
                                className={`border-b border-slate-100 cursor-pointer hover:bg-blue-50/50 ${clientOuvert === m.id ? 'bg-blue-50/70' : ''}`}
                              >
                                <td className="py-2 pr-3">
                                  <div className="flex items-center gap-2">
                                    {clientOuvert === m.id ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
                                    <div className="min-w-0">
                                      <p className="font-medium text-slate-800 truncate">{m.nom || m.email || 'Compte sans nom'}</p>
                                      <p className="text-[11px] text-slate-400 truncate">
                                        {m.email}
                                        {' · '}{planLabel(m.offre as Plan)}
                                        {m.role === 'admin' && ' · admin'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className={`py-2 px-2 text-right font-bold tabular-nums ${m.actions30 > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{m.actions30}</td>
                                <td className="py-2 px-2 text-right text-slate-500 tabular-nums">{m.actionsTotal}</td>
                                <td className="py-2 px-2 text-right text-slate-600 tabular-nums">{m.elearning}</td>
                                <td className="py-2 px-2 text-right text-slate-600 tabular-nums">{m.quiz}</td>
                                <td className="py-2 px-2 text-right text-slate-600 tabular-nums">{m.pratique}</td>
                                <td className="py-2 px-2 text-right text-slate-600 tabular-nums">{m.flashcards}</td>
                                <td className={`py-2 pl-2 text-right text-xs ${m.derniereActivite ? 'text-slate-500' : 'text-red-400 font-medium'}`}>
                                  {m.derniereActivite ? fmtDate(m.derniereActivite) : 'jamais'}
                                </td>
                              </tr>
                              {clientOuvert === m.id && (
                                <tr>
                                  <td colSpan={8} className="bg-slate-50/80 p-4">
                                    <UsageContenusClient userId={m.id} />
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!recherche && usage.membres.length > 12 && (
                    <button
                      onClick={() => setToutVoir(v => !v)}
                      className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      {toutVoir ? 'Réduire la liste' : `Voir les ${usage.membres.length} clients`}
                    </button>
                  )}
                </SectionCard>

                {/* ═══ ANGLES MORTS ═══ */}
                <SectionCard
                  title="Rubriques sans mesure d’usage"
                  subtitle="Ces contenus existent mais rien n’enregistre leur consultation"
                  accent="from-slate-300 to-slate-500"
                  icon={AlertTriangle}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {usage.sansSuivi.map(s => (
                      <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-700">{s.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{s.catalogue} contenus publiés, {s.note}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3">
                    Impossible aujourd’hui de dire si ces rubriques plaisent : il faudrait enregistrer une
                    consultation à l’ouverture, comme le font déjà les vidéos de pratique et les sous-parties de cours.
                  </p>
                </SectionCard>

                {/* Certificats et rappel de méthode */}
                <div className="rounded-2xl bg-white/70 border border-white/70 p-4 text-xs text-slate-500 space-y-1.5">
                  <p className="flex items-center gap-2 text-slate-600 font-semibold">
                    <Award className="h-4 w-4 text-amber-500" /> Comment lire ces chiffres
                  </p>
                  <p>
                    Un contenu compte comme utilisé dès qu’un client l’a ouvert ou validé une fois : une sous-partie
                    de cours quand elle est marquée terminée, une vidéo de pratique au visionnage, une carte à la
                    première révision.
                  </p>
                  <p>
                    L’avancement moyen d’une formation ne porte que sur les clients qui l’ont commencée :
                    une formation à 80% suivie par deux personnes n’est pas un succès, la colonne « Clients » le dit.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
