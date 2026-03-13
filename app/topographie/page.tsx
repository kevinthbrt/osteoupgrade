'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { fetchProfilePayload } from '@/lib/profile-client'
import { getAllTopographieViews } from '@/lib/topographie-topographic-api'
import type { AnatomicalRegion, TopographieView } from '@/lib/types-topographic-system'
import {
  Image as ImageIcon,
  Map,
  X,
  Loader2,
  Info,
  Eye
} from 'lucide-react'
import FreeContentGate from '@/components/FreeContentGate'
import FreeUserBanner from '@/components/FreeUserBanner'

const FREE_ACCESSIBLE_REGIONS_TOPO = ['epaule']

const REGION_LABELS: Record<AnatomicalRegion, string> = {
  cervical: 'Cervical',
  atm: 'ATM',
  crane: 'Crâne',
  thoracique: 'Thoracique',
  lombaire: 'Lombaire',
  'sacro-iliaque': 'Sacro-iliaque',
  cotes: 'Côtes',
  epaule: 'Épaule',
  coude: 'Coude',
  poignet: 'Poignet + main',
  hanche: 'Hanche',
  genou: 'Genou',
  cheville: 'Cheville',
  pied: 'Pied',
  neurologique: 'Neurologique',
  vasculaire: 'Vasculaire',
  systemique: 'Systémique'
}

const BODY_REGIONS_SVG: {
  region: AnatomicalRegion
  path: string
}[] = [
  { region: 'crane', path: 'M175,30 Q175,10 200,10 Q225,10 225,30 Q225,55 200,60 Q175,55 175,30Z' },
  { region: 'atm', path: 'M172,38 Q165,38 165,45 Q165,52 172,52 Q175,52 175,45 Q175,38 172,38Z M228,38 Q235,38 235,45 Q235,52 228,52 Q225,52 225,45 Q225,38 228,38Z' },
  { region: 'cervical', path: 'M188,60 L212,60 L215,85 L185,85Z' },
  { region: 'epaule', path: 'M140,88 Q130,85 125,95 Q120,108 130,115 L155,110 L155,88Z M245,88 L260,88 Q270,85 275,95 Q280,108 270,115 L245,110Z' },
  { region: 'thoracique', path: 'M155,88 L245,88 L245,140 L155,140Z' },
  { region: 'cotes', path: 'M155,140 L245,140 L250,165 L150,165Z' },
  { region: 'lombaire', path: 'M150,165 L250,165 L248,205 L152,205Z' },
  { region: 'sacro-iliaque', path: 'M152,205 L248,205 L245,230 L155,230Z' },
  { region: 'coude', path: 'M100,175 Q95,165 90,175 Q85,190 92,195 L108,195 Q115,190 110,175Z M290,175 Q295,165 300,175 Q305,190 298,195 L282,195 Q275,190 280,175Z' },
  { region: 'poignet', path: 'M80,235 Q75,225 72,235 Q68,250 75,260 L95,260 Q100,250 97,240Z M305,235 Q310,225 313,235 Q317,250 310,260 L290,260 Q285,250 288,240Z' },
  { region: 'hanche', path: 'M155,230 L195,230 L185,275 L145,275Z M205,230 L245,230 L255,275 L215,275Z' },
  { region: 'genou', path: 'M150,365 Q145,355 148,365 Q145,385 152,390 L178,390 Q185,385 182,370 Q185,360 180,355Z M220,365 Q215,355 218,365 Q215,385 222,390 L248,390 Q255,385 252,370 Q255,360 250,355Z' },
  { region: 'cheville', path: 'M152,485 Q148,475 150,485 Q148,500 155,505 L175,505 Q182,500 180,490 Q182,480 178,475Z M222,485 Q218,475 220,485 Q218,500 225,505 L245,505 Q252,500 250,490 Q252,480 248,475Z' },
  { region: 'pied', path: 'M148,505 L180,505 L185,530 Q185,540 165,545 Q145,540 143,530Z M220,505 L252,505 L257,530 Q257,540 237,545 Q217,540 215,530Z' }
]

const BODY_SILHOUETTE = `
  M200,10
  Q230,10 230,35 Q230,60 215,65
  L218,85
  Q260,82 280,100 Q295,115 300,140
  L310,175
  Q315,195 305,210
  L315,240
  Q320,260 310,270 L305,275
  Q295,260 290,260
  L280,235
  Q275,210 270,195
  L255,160
  L250,230
  Q260,250 260,280
  L258,340
  Q260,360 255,390
  L252,430
  Q255,460 252,490
  Q255,510 260,530
  Q260,545 240,550
  Q220,545 218,535
  L215,510
  Q215,500 218,480
  L220,430
  Q222,400 220,370
  L215,310
  Q212,290 200,280
  Q188,290 185,310
  L180,370
  Q178,400 180,430
  L182,480
  Q185,500 185,510
  L182,535
  Q180,545 160,550
  Q140,545 140,530
  Q145,510 148,490
  Q145,460 148,430
  L145,390
  Q140,360 142,340
  L140,280
  Q140,250 150,230
  L145,160
  L130,195
  Q125,210 120,235
  L110,260
  Q105,260 95,275
  L90,270
  Q80,260 85,240
  L90,210
  Q85,195 90,175
  L100,140
  Q105,115 120,100
  Q140,82 182,85
  L185,65
  Q170,60 170,35 Q170,10 200,10Z
`

const GENERAL_REGIONS: { region: AnatomicalRegion; label: string }[] = [
  { region: 'neurologique', label: 'Neurologique' },
  { region: 'vasculaire', label: 'Vasculaire' },
  { region: 'systemique', label: 'Systémique' }
]

export default function TopographiePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)
  const [views, setViews] = useState<TopographieView[]>([])
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegion | null>(null)
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegion | null>(null)
  const [activeView, setActiveView] = useState<TopographieView | null>(null)

  const sanitizeHtml = (html: string) => html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const payload = await fetchProfilePayload()
      if (!payload?.user) { router.push('/'); return }
      setRole(payload.profile?.role || null)
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    if (role) {
      getAllTopographieViews().then(setViews).catch(console.error)
    }
  }, [role])

  const isFree = role === 'free'
  const isLocked = isFree && selectedRegion ? !FREE_ACCESSIBLE_REGIONS_TOPO.includes(selectedRegion) : false

  const filteredViews = useMemo(() => {
    if (!selectedRegion) return []
    return views.filter(v => v.region === selectedRegion)
  }, [selectedRegion, views])

  const viewCountByRegion = useMemo(() => {
    const counts: Partial<Record<AnatomicalRegion, number>> = {}
    views.forEach(v => { counts[v.region] = (counts[v.region] || 0) + 1 })
    return counts
  }, [views])

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-slate-400 animate-spin" />
        </div>
      </AuthLayout>
    )
  }

  const handleSelectRegion = (region: AnatomicalRegion) => {
    setSelectedRegion(region)
    setActiveView(null)
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {isFree && <FreeUserBanner />}

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl" />
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 border border-white/20">
                <Map className="h-3.5 w-3.5 text-indigo-300" />
                <span className="text-xs font-semibold text-indigo-100">Topographie Interactive</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                Topographie
              </h1>
              <p className="text-base md:text-lg text-slate-300 max-w-2xl">
                Cliquez sur une zone du corps pour explorer les vues topographiques associées.
              </p>
            </div>
          </div>
        </div>

        {/* Main layout: Body + Content panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Body Model */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Sélectionnez une zone
              </h2>

              <div className="flex flex-col items-center">
                <svg
                  viewBox="60 0 280 560"
                  className="w-full max-w-[280px] h-auto select-none"
                  role="img"
                  aria-label="Modèle anatomique - cliquez sur une région"
                >
                  <path d={BODY_SILHOUETTE} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                  {BODY_REGIONS_SVG.map(({ region, path }) => {
                    const isSelected = selectedRegion === region
                    const isHovered = hoveredRegion === region
                    const count = viewCountByRegion[region] || 0
                    return (
                      <path
                        key={region}
                        d={path}
                        fill={
                          isSelected
                            ? 'rgba(99, 102, 241, 0.45)'
                            : isHovered
                            ? 'rgba(99, 102, 241, 0.25)'
                            : count > 0
                            ? 'rgba(99, 102, 241, 0.12)'
                            : 'rgba(148, 163, 184, 0.08)'
                        }
                        stroke={
                          isSelected ? '#4f46e5' : isHovered ? '#6366f1' : count > 0 ? '#818cf8' : '#cbd5e1'
                        }
                        strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                        className="cursor-pointer transition-all duration-200"
                        onClick={() => handleSelectRegion(region)}
                        onMouseEnter={() => setHoveredRegion(region)}
                        onMouseLeave={() => setHoveredRegion(null)}
                      >
                        <title>{REGION_LABELS[region]}{count > 0 ? ` (${count} vue${count > 1 ? 's' : ''})` : ''}</title>
                      </path>
                    )
                  })}
                </svg>

                {hoveredRegion && (
                  <div className="mt-2 text-sm font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    {REGION_LABELS[hoveredRegion]}
                    {(viewCountByRegion[hoveredRegion] || 0) > 0 && (
                      <span className="ml-2 text-xs text-indigo-600 font-medium">
                        {viewCountByRegion[hoveredRegion]} vue{(viewCountByRegion[hoveredRegion] || 0) > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                )}

                {/* General regions */}
                <div className="w-full mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-medium mb-2 text-center uppercase tracking-wider">Général</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {GENERAL_REGIONS.map(({ region, label }) => (
                      <button
                        key={region}
                        onClick={() => handleSelectRegion(region)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${
                          selectedRegion === region
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content Panel */}
          <div className="lg:col-span-8">
            {!selectedRegion ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-50 mb-6">
                  <Map className="h-10 w-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Explorez l'anatomie</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Cliquez sur une zone du modèle anatomique pour afficher les vues topographiques correspondantes.
                </p>
              </div>
            ) : (
              <FreeContentGate isLocked={isLocked}>
              <div className="space-y-6">
                {/* Region header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Map className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{REGION_LABELS[selectedRegion]}</h2>
                        <p className="text-sm text-slate-500">
                          {filteredViews.length} vue{filteredViews.length !== 1 ? 's' : ''} topographique{filteredViews.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedRegion(null); setActiveView(null) }}
                      className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
                    >
                      <X className="h-4 w-4" /> Fermer
                    </button>
                  </div>
                </div>

                {/* Topographic Views */}
                {filteredViews.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <Info className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">Aucune vue topographique</h3>
                    <p className="text-sm text-slate-500">
                      Il n'y a pas encore de vues topographiques pour la région {REGION_LABELS[selectedRegion]}.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-indigo-500" />
                        Vues topographiques
                      </h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredViews.map(view => (
                          <button
                            key={view.id}
                            onClick={() => setActiveView(activeView?.id === view.id ? null : view)}
                            className={`group text-left rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                              activeView?.id === view.id
                                ? 'border-indigo-400 bg-indigo-50/50 shadow-md ring-2 ring-indigo-200'
                                : 'border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                            }`}
                          >
                            {view.image_url ? (
                              <div className="h-36 bg-white border-b border-slate-100 flex items-center justify-center overflow-hidden">
                                <img
                                  src={view.image_url}
                                  alt={view.name}
                                  className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div className="h-36 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-100 flex items-center justify-center">
                                <ImageIcon className="h-10 w-10 text-slate-300" />
                              </div>
                            )}
                            <div className="p-3">
                              <p className="font-semibold text-slate-900 text-sm line-clamp-2">{view.name}</p>
                              {view.description && (
                                <div
                                  className="text-xs text-slate-500 mt-1 line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(view.description) }}
                                />
                              )}
                              <div className="flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600">
                                <Eye className="h-3 w-3" />
                                {activeView?.id === view.id ? 'Sélectionné' : 'Voir détails'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Expanded view detail */}
                    {activeView && (
                      <div className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">Vue topographique</p>
                            <h4 className="text-xl font-bold text-slate-900">{activeView.name}</h4>
                          </div>
                          <button
                            onClick={() => setActiveView(null)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {activeView.image_url && (
                          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
                            <img
                              src={activeView.image_url}
                              alt={activeView.name}
                              className="w-full max-h-[500px] object-contain"
                            />
                          </div>
                        )}
                        {activeView.description && (
                          <div
                            className="prose prose-sm text-slate-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeView.description) }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              </FreeContentGate>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
