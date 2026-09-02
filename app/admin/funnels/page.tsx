'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import {
  Loader2,
  Plus,
  Route as RouteIcon,
  Eye,
  Users,
  ExternalLink,
  Circle,
} from 'lucide-react'

type FunnelRow = {
  id: string
  slug: string
  name: string
  status: 'draft' | 'published' | 'archived'
  plan_type: string | null
  updated_at: string
  leads_count: number
  views_count: number
}

const STATUS_LABELS: Record<FunnelRow['status'], { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-slate-100 text-slate-600' },
  published: { label: 'En ligne', className: 'bg-emerald-100 text-emerald-700' },
  archived: { label: 'Archivé', className: 'bg-amber-100 text-amber-700' },
}

export default function AdminFunnelsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [funnels, setFunnels] = useState<FunnelRow[]>([])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }
      await load()
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    const res = await fetch('/api/admin/funnels')
    if (res.ok) {
      const data = await res.json()
      setFunnels(data.funnels || [])
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    setError(null)

    // Un slug daté évite la collision au deuxième « Nouveau funnel » du jour
    // sans imposer une boîte de dialogue avant même d'avoir écrit la page.
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const suffix = Math.random().toString(36).slice(2, 6)

    try {
      const res = await fetch('/api/admin/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: `nouveau-funnel-${stamp}-${suffix}`,
          name: 'Nouveau funnel',
          status: 'draft',
          content: [],
          deadline_mode: 'none',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/admin/funnels/${data.funnel.id}`)
    } catch (err: any) {
      setError(err.message || 'Création impossible')
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="mx-auto max-w-5xl">
        <AdminBackButton />

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
              <RouteIcon className="h-7 w-7 text-blue-600" />
              Funnels
            </h1>
            <p className="mt-1 text-slate-500">
              Pages de vente autonomes, éditables sans redéploiement.
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flow-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nouveau funnel
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {funnels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <RouteIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">Aucun funnel pour l’instant</p>
            <p className="mt-1 text-sm text-slate-500">
              Créez une page, ajoutez vos blocs, publiez : l’URL sera <code>/f/votre-slug</code>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {funnels.map((funnel) => {
              const status = STATUS_LABELS[funnel.status]
              return (
                <div
                  key={funnel.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/admin/funnels/${funnel.id}`}
                        className="truncate font-bold text-slate-900 hover:text-blue-600"
                      >
                        {funnel.name}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                      >
                        <Circle className="h-1.5 w-1.5 fill-current" />
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-slate-400">/f/{funnel.slug}</p>
                  </div>

                  <div className="flex items-center gap-5 text-sm">
                    <span className="flex items-center gap-1.5 text-slate-500" title="Vues">
                      <Eye className="h-4 w-4" />
                      {funnel.views_count}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-500" title="Leads captés">
                      <Users className="h-4 w-4" />
                      {funnel.leads_count}
                    </span>
                    {/* Un brouillon s'ouvre en aperçu (admin) plutôt que sur
                        une 404 : c'est la seule façon de le relire avant de le
                        publier. */}
                    <a
                      href={
                        funnel.status === 'published'
                          ? `/f/${funnel.slug}`
                          : `/f/${funnel.slug}?preview=1`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-medium text-blue-600 hover:underline"
                    >
                      {funnel.status === 'published' ? 'Voir' : 'Aperçu'}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
