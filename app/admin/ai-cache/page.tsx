'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import { Database, TrendingDown, Zap, Clock, BarChart2, RefreshCw } from 'lucide-react'

type EndpointStats = {
  calls: number
  cache_hits: number
  cache_misses: number
  total_cache_creation: number
  total_cache_read: number
  total_input: number
  total_output: number
  cost_actual: number
  cost_without_cache: number
}

type RecentRow = {
  created_at: string
  endpoint: string
  input_tokens: number
  output_tokens: number
  cache_creation_tokens: number
  cache_read_tokens: number
}

const ENDPOINT_LABELS: Record<string, string> = {
  'generate-hypotheses': 'Hypothèses cliniques',
  'structure-anamnesis': 'Structuration anamnèse',
}

function fmt$(n: number) {
  return n < 0.01 ? `< 0,01 $` : `${n.toFixed(3)} $`
}

function pct(a: number, b: number) {
  return b === 0 ? '—' : `${Math.round((a / b) * 100)} %`
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-start gap-3">
      <div className={`rounded-lg p-2 ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AiCachePage() {
  const router = useRouter()
  const [stats, setStats] = useState<Record<string, EndpointStats>>({})
  const [recent, setRecent] = useState<RecentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') { router.push('/dashboard'); return }
    fetchStats()
  }

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ai-cache')
      if (!res.ok) throw new Error('Erreur réseau')
      const d = await res.json()
      setStats(d.stats ?? {})
      setRecent(d.recent ?? [])
    } catch {
      setError('Impossible de charger les statistiques.')
    } finally {
      setLoading(false)
    }
  }

  const totalCalls = Object.values(stats).reduce((s, v) => s + v.calls, 0)
  const totalHits = Object.values(stats).reduce((s, v) => s + v.cache_hits, 0)
  const totalActual = Object.values(stats).reduce((s, v) => s + v.cost_actual, 0)
  const totalWithout = Object.values(stats).reduce((s, v) => s + v.cost_without_cache, 0)
  const totalSaved = totalWithout - totalActual

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 px-6 pt-8 pb-16 md:px-8">
          <AdminBackButton />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2.5">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Cache IA — Suivi</h1>
                <p className="text-violet-200 text-sm">7 derniers jours · cache Anthropic prompt caching</p>
              </div>
            </div>
            <button
              onClick={fetchStats}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-2 rounded-lg transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualiser
            </button>
          </div>
        </div>

        <div className="px-6 md:px-8 -mt-10 pb-16 space-y-6">
          {loading ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">Chargement…</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
          ) : totalCalls === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
              Aucune donnée sur les 7 derniers jours. Les logs apparaîtront après la prochaine génération d'hypothèses ou structuration.
            </div>
          ) : (
            <>
              {/* Global KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Appels IA (7j)" value={`${totalCalls}`} icon={BarChart2} color="bg-violet-500" />
                <StatCard
                  label="Taux de cache hit"
                  value={pct(totalHits, totalCalls)}
                  sub={`${totalHits} hits / ${totalCalls - totalHits} miss`}
                  icon={Zap}
                  color="bg-emerald-500"
                />
                <StatCard
                  label="Coût réel (7j)"
                  value={fmt$(totalActual)}
                  sub={`sans cache : ${fmt$(totalWithout)}`}
                  icon={TrendingDown}
                  color="bg-sky-500"
                />
                <StatCard
                  label="Économisé (7j)"
                  value={fmt$(totalSaved > 0 ? totalSaved : 0)}
                  sub={totalWithout > 0 ? `soit ${Math.round((totalSaved / totalWithout) * 100)} % de réduction` : undefined}
                  icon={Clock}
                  color="bg-amber-500"
                />
              </div>

              {/* Per-endpoint breakdown */}
              <div className="space-y-4">
                {Object.entries(stats).map(([ep, s]) => (
                  <div key={ep} className="bg-white rounded-xl border overflow-hidden">
                    <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">{ENDPOINT_LABELS[ep] ?? ep}</h3>
                      <span className="text-xs text-gray-500">{s.calls} appels</span>
                    </div>
                    <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Cache hits</p>
                        <p className="font-bold text-emerald-600">{pct(s.cache_hits, s.calls)}</p>
                        <p className="text-xs text-gray-400">{s.cache_hits} hits / {s.cache_misses} miss</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Tokens créés (write)</p>
                        <p className="font-bold text-gray-800">{s.total_cache_creation.toLocaleString('fr')}</p>
                        <p className="text-xs text-gray-400">3,75 $/MTok</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Tokens relus (read)</p>
                        <p className="font-bold text-gray-800">{s.total_cache_read.toLocaleString('fr')}</p>
                        <p className="text-xs text-gray-400">0,30 $/MTok</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Économie estimée</p>
                        <p className="font-bold text-sky-600">{fmt$(s.cost_without_cache - s.cost_actual)}</p>
                        <p className="text-xs text-gray-400">
                          réel : {fmt$(s.cost_actual)} / sans cache : {fmt$(s.cost_without_cache)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interpretation hint */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-800">
                <strong>Interpréter le taux de hit :</strong> Un hit signifie que le catalogue des tests était encore en cache Anthropic au moment de l'appel.
                Avec le TTL 1h, chaque premier appel de l'heure crée le cache (write, +25 %) ; les appels suivants dans la même heure le lisent (read, −90 %).
                Si le taux est &gt; 50 %, le TTL 1h est clairement rentable. S'il est &lt; 20 %, votre cadence de consultations est trop espacée et 5 min suffirait — mais le write coût reste négligeable.
              </div>

              {/* Recent calls log */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-5 py-3 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-800">Derniers appels (≤ 200)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 border-b">
                        <th className="text-left px-4 py-2">Date</th>
                        <th className="text-left px-4 py-2">Endpoint</th>
                        <th className="text-right px-4 py-2">Input</th>
                        <th className="text-right px-4 py-2">Cache write</th>
                        <th className="text-right px-4 py-2">Cache read</th>
                        <th className="text-right px-4 py-2">Output</th>
                        <th className="text-center px-4 py-2">Hit?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((r, i) => {
                        const hit = (r.cache_read_tokens ?? 0) > 0
                        return (
                          <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-2 text-gray-500 whitespace-nowrap">
                              {new Date(r.created_at).toLocaleString('fr-FR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-2 text-gray-700">{ENDPOINT_LABELS[r.endpoint] ?? r.endpoint}</td>
                            <td className="px-4 py-2 text-right">{(r.input_tokens ?? 0).toLocaleString('fr')}</td>
                            <td className="px-4 py-2 text-right text-amber-600">{(r.cache_creation_tokens ?? 0).toLocaleString('fr')}</td>
                            <td className="px-4 py-2 text-right text-emerald-600">{(r.cache_read_tokens ?? 0).toLocaleString('fr')}</td>
                            <td className="px-4 py-2 text-right">{(r.output_tokens ?? 0).toLocaleString('fr')}</td>
                            <td className="px-4 py-2 text-center">
                              {hit ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-gray-300">–</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
