'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import BlockEditor from '@/components/funnel/BlockEditor'
import {
  BLOCK_LABELS,
  FUNNEL_BLOCK_TYPES,
  funnelTriggerEvent,
  type FunnelBlockType,
} from '@/lib/funnels'
import { OFFERS, formatAmount } from '@/lib/offers'
import {
  Loader2,
  Save,
  Trash2,
  ExternalLink,
  Plus,
  Eye,
  MousePointerClick,
  Users,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react'

type Stats = { view: number; cta_click: number; optin: number; checkout_started: number }
type FunnelAutomation = { id: string; name: string; active: boolean; steps_count: number }
type Lead = {
  id: string
  email: string
  full_name: string | null
  utm: Record<string, string>
  created_at: string
  deadline_at: string | null
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

/**
 * Offres proposables depuis un funnel.
 *
 * Construites depuis `lib/offers` et non `lib/stripe` : ce dernier instancie
 * le SDK Stripe et ne peut pas être importé par un composant client.
 */
const PLAN_OPTIONS = OFFERS.flatMap((offer) => [
  { value: offer.planType, label: `${offer.name} — ${formatAmount(offer.monthlyAmount)}/mois` },
  {
    value: offer.foundingPlanType,
    label: `${offer.name} Fondateur — ${formatAmount(offer.foundingAnnualAmount)}/an`,
  },
])

/**
 * Instant absolu (ISO) → valeur d'un `<input type="datetime-local">`.
 *
 * L'input travaille en heure locale, `toISOString()` rend de l'UTC. Afficher
 * l'un pour l'autre décale l'échéance du fuseau à chaque enregistrement : une
 * date saisie à 23h59 en France repartirait à 21h59 au tour suivant.
 */
function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

/** Contenu de départ d'un nouveau bloc, pour ne pas partir d'un formulaire vide. */
function blankBlock(type: FunnelBlockType): any {
  const id = `${type}-${Math.random().toString(36).slice(2, 9)}`
  switch (type) {
    case 'hero':
      return { id, type, title: 'Votre accroche', ctaTarget: 'checkout', ctaLabel: 'Je démarre' }
    case 'video':
      return { id, type, embedUrl: '' }
    case 'benefits':
      return { id, type, title: 'Ce que vous obtenez', items: [{ title: '', text: '' }] }
    case 'testimonials':
      return { id, type, title: 'Ils l’utilisent', items: [{ quote: '', author: '' }] }
    case 'curriculum':
      return { id, type, title: 'Le programme', modules: [{ title: '', lessons: [] }] }
    case 'pricing':
      return { id, type, title: 'L’offre', features: [], ctaLabel: 'Je m’abonne' }
    case 'guarantee':
      return { id, type, title: 'Garantie', text: '' }
    case 'faq':
      return { id, type, title: 'Questions fréquentes', items: [{ question: '', answer: '' }] }
    case 'cta':
      return { id, type, ctaLabel: 'Je m’abonne', ctaTarget: 'checkout' }
    case 'optin':
      return { id, type, title: 'Recevez la formation', askName: true }
    case 'text':
      return { id, type, body: '' }
    default:
      return { id, type }
  }
}

export default function FunnelEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState<any>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [stats, setStats] = useState<Stats>({ view: 0, cta_click: 0, optin: 0, checkout_started: 0 })
  const [leads, setLeads] = useState<Lead[]>([])
  const [automation, setAutomation] = useState<FunnelAutomation | null>(null)
  const [creatingSequence, setCreatingSequence] = useState(false)

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

      const res = await fetch(`/api/admin/funnels/${params.id}`)
      if (!res.ok) {
        setError('Funnel introuvable')
        setLoading(false)
        return
      }
      const data = await res.json()
      setForm(data.funnel)
      setBlocks(Array.isArray(data.funnel.content) ? data.funnel.content : [])
      setStats(data.stats)
      setLeads(data.leads)
      await loadAutomation(data.funnel.slug)
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const set = (patch: any) => setForm((prev: any) => ({ ...prev, ...patch }))

  /** Séquence email rattachée à ce funnel, s'il en existe une. */
  const loadAutomation = async (slug: string) => {
    const res = await fetch('/api/automations')
    if (!res.ok) return
    const data = await res.json()
    const trigger = funnelTriggerEvent(slug)
    const found = (data.automations || []).find((a: any) => a.trigger_event === trigger)
    setAutomation(
      found
        ? {
            id: found.id,
            name: found.name,
            active: found.active,
            steps_count: Array.isArray(found.steps) ? found.steps.length : 0,
          }
        : null
    )
  }

  const handleCreateSequence = async () => {
    setCreatingSequence(true)
    setError(null)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Funnel — ${form.name}`,
          description: `Séquence déclenchée par les inscriptions sur /f/${form.slug}`,
          trigger_event: funnelTriggerEvent(form.slug),
          steps: [],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await loadAutomation(form.slug)
    } catch (err: any) {
      setError(err.message || 'Création de la séquence impossible')
    } finally {
      setCreatingSequence(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/funnels/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: form.slug,
          name: form.name,
          status: form.status,
          meta_title: form.meta_title || null,
          meta_description: form.meta_description || null,
          content: blocks,
          plan_type: form.plan_type || null,
          deadline_mode: form.deadline_mode,
          // `datetime-local` rend une date sans fuseau ; la base attend un
          // instant absolu, sinon l'échéance glisse selon le navigateur qui
          // l'a saisie.
          deadline_at:
            form.deadline_mode === 'fixed' && form.deadline_at
              ? new Date(form.deadline_at).toISOString()
              : null,
          deadline_days:
            form.deadline_mode === 'relative' && form.deadline_days
              ? Number(form.deadline_days)
              : null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Enregistré.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Supprimer « ${form.name} » ? Les leads et statistiques de cette page seront perdus.`)) {
      return
    }
    const res = await fetch(`/api/admin/funnels/${params.id}`, { method: 'DELETE' })
    if (res.ok) router.push('/admin/funnels')
    else setError('Suppression impossible')
  }

  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    setBlocks(next)
  }

  const copyTrigger = () => {
    navigator.clipboard.writeText(funnelTriggerEvent(form.slug))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  if (!form) {
    return (
      <AuthLayout>
        <div className="mx-auto max-w-3xl">
          <AdminBackButton />
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error || 'Funnel introuvable'}
          </p>
        </div>
      </AuthLayout>
    )
  }

  const statCards = [
    { label: 'Vues', value: stats.view, icon: Eye },
    { label: 'Clics CTA', value: stats.cta_click, icon: MousePointerClick },
    { label: 'Leads', value: stats.optin, icon: Users },
    { label: 'Vers paiement', value: stats.checkout_started, icon: CreditCard },
  ]

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl pb-24">
        <AdminBackButton />

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900">{form.name}</h1>
            <a
              href={`/f/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs text-blue-600 hover:underline"
            >
              /f/{form.slug}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label="Supprimer le funnel"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flow-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Statistiques */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <card.icon className="mb-1.5 h-4 w-4 text-slate-400" />
              <div className="text-2xl font-bold text-slate-900">{card.value}</div>
              <div className="text-xs text-slate-500">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Réglages */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-slate-900">Réglages</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Nom interne</label>
              <input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Slug (URL)</label>
              <input
                value={form.slug}
                onChange={(e) => set({ slug: e.target.value })}
                className={`${inputClass} font-mono`}
              />
              <p className="mt-1 text-xs text-slate-400">
                Minuscules, chiffres et tirets. Changer le slug casse les liens déjà envoyés.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Statut</label>
              <select
                value={form.status}
                onChange={(e) => set({ status: e.target.value })}
                className={inputClass}
              >
                <option value="draft">Brouillon (invisible)</option>
                <option value="published">En ligne</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Offre souscrite</label>
              <select
                value={form.plan_type ?? ''}
                onChange={(e) => set({ plan_type: e.target.value || null })}
                className={inputClass}
              >
                <option value="">Aucune (capture email seule)</option>
                {PLAN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Titre de la page (onglet & partage)
              </label>
              <input
                value={form.meta_title ?? ''}
                onChange={(e) => set({ meta_title: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
              <textarea
                value={form.meta_description ?? ''}
                onChange={(e) => set({ meta_description: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Échéance */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-bold text-slate-900">Échéance de l’offre</h2>
          <p className="mb-4 text-sm text-slate-500">
            Le compte à rebours s’affiche dans les blocs Accroche, Tarifs et Appel à l’action.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Mode</label>
              <select
                value={form.deadline_mode}
                onChange={(e) => set({ deadline_mode: e.target.value })}
                className={inputClass}
              >
                <option value="none">Aucune</option>
                <option value="fixed">Date fixe (même pour tous)</option>
                <option value="relative">J+N après l’inscription (propre à chaque lead)</option>
              </select>
            </div>

            {form.deadline_mode === 'fixed' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Date de fin</label>
                <input
                  type="datetime-local"
                  value={toLocalInputValue(form.deadline_at)}
                  onChange={(e) => set({ deadline_at: e.target.value })}
                  className={inputClass}
                />
              </div>
            )}

            {form.deadline_mode === 'relative' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Nombre de jours après l’opt-in
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.deadline_days ?? ''}
                  onChange={(e) => set({ deadline_days: e.target.value })}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Le décompte n’apparaît qu’après l’inscription : avant, il n’y a rien à décompter.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Séquence email */}
        <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-1 font-bold text-slate-900">Séquence email</h2>
          <p className="mb-3 text-sm text-slate-600">
            Chaque inscription sur cette page déclenche la séquence portant ce déclencheur :
          </p>
          <div className="mb-4 flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 font-mono text-sm text-blue-800">
              {funnelTriggerEvent(form.slug)}
            </code>
            <button
              onClick={copyTrigger}
              className="rounded-lg border border-blue-200 bg-white p-2.5 text-blue-600 transition hover:bg-blue-100"
              aria-label="Copier le déclencheur"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {automation ? (
            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{automation.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {automation.steps_count} email{automation.steps_count > 1 ? 's' : ''} ·{' '}
                    {automation.active ? 'active' : 'inactive'}
                  </p>
                </div>
                <a
                  href="/admin/automations"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Ouvrir les automatisations
                </a>
              </div>
              {automation.steps_count === 0 && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  La séquence existe mais ne contient aucun email : rien ne partira tant qu’une étape
                  n’y est pas ajoutée. L’ajout d’étapes se fait aujourd’hui en base (migration SQL),
                  comme pour les séquences du cycle de vie — il n’existe pas encore d’éditeur d’étapes
                  dans l’interface.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-blue-200 bg-white p-4">
              <p className="mb-3 text-sm text-slate-600">
                Aucune séquence n’écoute encore ce déclencheur. Les inscriptions seront bien
                enregistrées et ajoutées à la liste de diffusion, mais aucun email ne partira.
              </p>
              <button
                onClick={handleCreateSequence}
                disabled={creatingSequence}
                className="flex items-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"
              >
                {creatingSequence ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Créer la séquence
              </button>
            </div>
          )}
        </section>

        {/* Blocs */}
        <section className="mb-6">
          <h2 className="mb-4 font-bold text-slate-900">Contenu de la page</h2>

          {blocks.length === 0 && (
            <p className="mb-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aucun bloc. Ajoutez une accroche pour commencer.
            </p>
          )}

          <div className="space-y-4">
            {blocks.map((block, index) => (
              <BlockEditor
                key={block.id ?? index}
                block={block}
                index={index}
                total={blocks.length}
                onChange={(updated) => {
                  const next = [...blocks]
                  next[index] = updated
                  setBlocks(next)
                }}
                onMove={(direction) => moveBlock(index, direction)}
                onRemove={() => setBlocks(blocks.filter((_, i) => i !== index))}
              />
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Plus className="h-3.5 w-3.5" />
              Ajouter un bloc
            </p>
            <div className="flex flex-wrap gap-2">
              {FUNNEL_BLOCK_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setBlocks([...blocks, blankBlock(type)])}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                >
                  {BLOCK_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Leads */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-slate-900">
            Derniers leads {leads.length > 0 && <span className="text-slate-400">({leads.length})</span>}
          </h2>
          {leads.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun lead capté pour l’instant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Prénom</th>
                    <th className="pb-2">Campagne</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 font-medium text-slate-900">{lead.email}</td>
                      <td className="py-2 text-slate-600">{lead.full_name || '—'}</td>
                      <td className="py-2 text-slate-500">
                        {lead.utm?.utm_campaign || lead.utm?.utm_source || '—'}
                      </td>
                      <td className="py-2 whitespace-nowrap text-slate-500">
                        {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AuthLayout>
  )
}
