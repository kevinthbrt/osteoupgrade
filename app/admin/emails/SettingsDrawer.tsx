'use client'

import { useEffect, useMemo, useState } from 'react'
import { Filter, FileText, Loader2, Plus, RefreshCw, Save, Settings2, Trash2, X } from 'lucide-react'
import { CATEGORY_LABELS, INBOX_CATEGORIES, mergeVariables, renderReplyHtml } from '@/lib/inbox-render'
import {
  CATEGORY_STYLE, api,
  type InboxCategory, type InboxLayout, type InboxRule, type InboxSettings, type InboxTemplate,
} from './inbox-types'

type Tab = 'templates' | 'rules' | 'settings'

interface Props {
  open: boolean
  initialTab?: Tab
  templates: InboxTemplate[]
  settings: InboxSettings
  aiAvailable: boolean
  onClose: () => void
  onTemplatesChange: (t: InboxTemplate[]) => void
  onSettingsChange: (s: InboxSettings) => void
  onReclassified: (msg: string) => void
}

const FIELD_LABELS: Record<InboxRule['field'], string> = {
  from: 'Expéditeur',
  domain: 'Domaine',
  subject: 'Objet contient',
  body: 'Message contient',
}

const EMPTY_TEMPLATE: Omit<InboxTemplate, 'id'> = {
  name: '',
  category: null,
  subject: null,
  body: 'Bonjour {{prenom}},\n\n',
  layout: 'simple',
  emoji: null,
  banner_title: null,
  sort_order: 100,
}

// ── Modèles ────────────────────────────────────────────────────────────────

function TemplatesTab({ templates, settings, onChange }: { templates: InboxTemplate[]; settings: InboxSettings; onChange: (t: InboxTemplate[]) => void }) {
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(templates[0]?.id ?? 'new')
  const [draft, setDraft] = useState<Omit<InboxTemplate, 'id'>>(EMPTY_TEMPLATE)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (selectedId === 'new' || !selectedId) setDraft(EMPTY_TEMPLATE)
    else {
      const t = templates.find((x) => x.id === selectedId)
      if (t) setDraft({ ...t })
    }
    setErr(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const preview = useMemo(
    () =>
      renderReplyHtml({
        body: mergeVariables(draft.body, { prenom: 'Camille', nom: 'Camille Martin', offre: 'Premium', email: 'camille@exemple.fr' }),
        signature: settings.signature,
        layout: draft.layout,
        subject: draft.subject || draft.name || 'Objet',
        emoji: draft.emoji,
        bannerTitle: draft.banner_title,
      }),
    [draft, settings.signature]
  )

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      if (selectedId === 'new' || !selectedId) {
        const { template } = await api<{ template: InboxTemplate }>('/api/admin/inbox/templates', { method: 'POST', json: draft })
        onChange([...templates, template].sort((a, b) => a.sort_order - b.sort_order))
        setSelectedId(template.id)
      } else {
        const { template } = await api<{ template: InboxTemplate }>(`/api/admin/inbox/templates/${selectedId}`, { method: 'PATCH', json: draft })
        onChange(templates.map((t) => (t.id === template.id ? template : t)))
      }
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!selectedId || selectedId === 'new') return
    if (!confirm('Supprimer ce modèle ?')) return
    await api(`/api/admin/inbox/templates/${selectedId}`, { method: 'DELETE' })
    const rest = templates.filter((t) => t.id !== selectedId)
    onChange(rest)
    setSelectedId(rest[0]?.id ?? 'new')
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full min-h-0">
      <div className="md:w-56 shrink-0 flex flex-col gap-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => setSelectedId('new')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${selectedId === 'new' ? 'bg-violet-600 text-white' : 'text-violet-700 bg-violet-50 hover:bg-violet-100'}`}
        >
          <Plus className="h-4 w-4" /> Nouveau modèle
        </button>
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedId(t.id)}
            className={`text-left px-3 py-2 rounded-xl text-sm transition ${selectedId === t.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
          >
            <span className="block truncate">{t.name}</span>
            <span className={`text-[10px] ${selectedId === t.id ? 'text-slate-300' : 'text-slate-400'}`}>
              {t.category ? CATEGORY_LABELS[t.category] : 'Toutes catégories'} · {t.layout === 'brand' ? 'Illustré' : 'Sobre'}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0 grid xl:grid-cols-2 gap-4 overflow-y-auto">
        <div className="space-y-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Nom du modèle"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-violet-200"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.category || ''}
              onChange={(e) => setDraft({ ...draft, category: (e.target.value || null) as InboxCategory | null })}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              <option value="">Suggéré partout</option>
              {INBOX_CATEGORIES.map((c) => (
                <option key={c} value={c}>Suggéré pour {CATEGORY_LABELS[c]}</option>
              ))}
            </select>
            <select
              value={draft.layout}
              onChange={(e) => setDraft({ ...draft, layout: e.target.value as InboxLayout })}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
            >
              <option value="simple">Gabarit sobre</option>
              <option value="brand">Gabarit illustré (bandeau)</option>
            </select>
          </div>
          {draft.layout === 'brand' && (
            <div className="flex gap-2">
              <input
                value={draft.emoji || ''}
                onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
                placeholder="✉️"
                className="w-16 text-center px-2 py-2 rounded-xl border border-slate-200 text-sm"
              />
              <input
                value={draft.banner_title || ''}
                onChange={(e) => setDraft({ ...draft, banner_title: e.target.value })}
                placeholder="Titre du bandeau (sinon l’objet)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          )}
          <input
            value={draft.subject || ''}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            placeholder="Objet (facultatif, pour un nouveau message)"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
          <textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            rows={12}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-violet-200 resize-y"
          />
          <p className="text-[11px] text-slate-500">
            Variables : <code>{'{{prenom}}'}</code> <code>{'{{nom}}'}</code> <code>{'{{offre}}'}</code> <code>{'{{email}}'}</code>. La signature est ajoutée automatiquement.
          </p>
          {err && <p className="text-xs text-rose-600">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={saving || !draft.name.trim() || !draft.body.trim()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
            </button>
            {selectedId && selectedId !== 'new' && (
              <button type="button" onClick={remove} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-rose-600 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" /> Supprimer
              </button>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden min-h-[360px]">
          <p className="px-3 py-2 text-[11px] font-medium text-slate-500 border-b border-slate-200 bg-white">Aperçu (exemple : Camille, Premium)</p>
          <iframe title="Aperçu du modèle" srcDoc={preview} sandbox="" className="w-full h-[520px] bg-white" />
        </div>
      </div>
    </div>
  )
}

// ── Règles ─────────────────────────────────────────────────────────────────

function RulesTab({ onReclassified }: { onReclassified: (msg: string) => void }) {
  const [rules, setRules] = useState<InboxRule[] | null>(null)
  const [form, setForm] = useState<{ field: InboxRule['field']; pattern: string; category: InboxCategory; mark_done: boolean }>({
    field: 'domain',
    pattern: '',
    category: 'spam',
    mark_done: true,
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api<{ rules: InboxRule[] }>('/api/admin/inbox/rules').then((d) => setRules(d.rules)).catch((e) => setErr(e.message))
  }, [])

  async function add() {
    setBusy(true)
    setErr(null)
    try {
      const { rule, reclassified } = await api<{ rule: InboxRule; reclassified: { changed: number } | null }>('/api/admin/inbox/rules', {
        method: 'POST',
        json: { ...form, applyToExisting: true },
      })
      setRules((prev) => [...(prev || []).filter((r) => r.id !== rule.id), rule].sort((a, b) => a.priority - b.priority))
      setForm({ ...form, pattern: '' })
      onReclassified(`Règle ajoutée${reclassified ? `, ${reclassified.changed} conversation(s) reclassée(s)` : ''}.`)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(rule: InboxRule) {
    const { rule: updated } = await api<{ rule: InboxRule }>(`/api/admin/inbox/rules/${rule.id}`, { method: 'PATCH', json: { is_active: !rule.is_active } })
    setRules((prev) => (prev || []).map((r) => (r.id === updated.id ? updated : r)))
  }

  async function remove(rule: InboxRule) {
    if (!confirm('Supprimer cette règle ?')) return
    await api(`/api/admin/inbox/rules/${rule.id}`, { method: 'DELETE' })
    setRules((prev) => (prev || []).filter((r) => r.id !== rule.id))
  }

  async function reclassify() {
    setBusy(true)
    try {
      const res = await api<{ examined: number; changed: number }>('/api/admin/inbox/reclassify', { method: 'POST' })
      onReclassified(`${res.changed} conversation(s) reclassée(s) sur ${res.examined}.`)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 overflow-y-auto h-full">
      <div className="rounded-2xl bg-violet-50/70 border border-violet-100 p-4 text-xs text-slate-600 leading-relaxed">
        <p className="font-semibold text-slate-800 mb-1">Comment le courrier est classé</p>
        Les règles ci-dessous passent en premier. Viennent ensuite la détection des messages automatiques (notifications, absences, rebonds), du spam
        (jamais pour un expéditeur qui a un compte), puis des mots-clés (facturation, parrainage, support, prospection). Quand rien n’est sûr, l’IA tranche
        si elle est activée. Une catégorie choisie à la main n’est jamais modifiée.
      </div>

      <div className="flex flex-wrap items-end gap-2 p-3 rounded-2xl border border-slate-200 bg-white">
        <select value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value as InboxRule['field'] })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
          {Object.entries(FIELD_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          value={form.pattern}
          onChange={(e) => setForm({ ...form, pattern: e.target.value })}
          placeholder={form.field === 'domain' ? 'exemple.com' : form.field === 'from' ? 'adresse@exemple.com' : 'mot ou expression'}
          className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-slate-200 text-sm"
        />
        <span className="text-sm text-slate-500 py-2">→</span>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as InboxCategory })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm">
          {INBOX_CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 py-2">
          <input type="checkbox" checked={form.mark_done} onChange={(e) => setForm({ ...form, mark_done: e.target.checked })} className="accent-violet-600" />
          Traité d’office
        </label>
        <button type="button" onClick={add} disabled={busy || !form.pattern.trim()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>
      {err && <p className="text-xs text-rose-600">{err}</p>}

      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        {rules === null && <p className="p-4 text-sm text-slate-400">Chargement…</p>}
        {rules?.length === 0 && <p className="p-4 text-sm text-slate-400">Aucune règle.</p>}
        {rules?.map((r) => (
          <div key={r.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${r.is_active ? '' : 'opacity-50'}`}>
            <span className="text-[11px] text-slate-500 w-28">{FIELD_LABELS[r.field]}</span>
            <code className="text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{r.pattern}</code>
            <span className="text-slate-400 text-xs">→</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ring-1 ring-inset ${CATEGORY_STYLE[r.category].pill}`}>{CATEGORY_LABELS[r.category]}</span>
            {r.mark_done && <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">traité d’office</span>}
            <span className="ml-auto text-[11px] text-slate-400">{r.hit_count} application(s)</span>
            <button type="button" onClick={() => toggle(r)} className="text-xs text-slate-600 hover:text-violet-700">{r.is_active ? 'Désactiver' : 'Activer'}</button>
            <button type="button" onClick={() => remove(r)} className="p-1 rounded text-slate-400 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>

      <button type="button" onClick={reclassify} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50">
        <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /> Reclasser le courrier existant
      </button>
    </div>
  )
}

// ── Réglages ───────────────────────────────────────────────────────────────

function SettingsTab({ settings, aiAvailable, onChange }: { settings: InboxSettings; aiAvailable: boolean; onChange: (s: InboxSettings) => void }) {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setErr(null)
    try {
      const { settings: s } = await api<{ settings: InboxSettings }>('/api/admin/inbox/settings', { method: 'PATCH', json: form })
      onChange(s)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5 overflow-y-auto h-full">
      <label className="block">
        <span className="text-sm font-medium text-slate-800">Nom d’expéditeur</span>
        <input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        <span className="text-[11px] text-slate-500">Les réponses partent de l’adresse qui a reçu le message (contact@, admin@…).</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-800">Signature</span>
        <textarea value={form.signature} onChange={(e) => setForm({ ...form, signature: e.target.value })} rows={4} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
        <span className="text-[11px] text-slate-500">Ajoutée automatiquement sous chaque réponse et nouveau message.</span>
      </label>
      <div>
        <span className="text-sm font-medium text-slate-800">Gabarit par défaut</span>
        <div className="mt-1 inline-flex p-0.5 rounded-xl bg-slate-100 text-sm">
          {(['simple', 'brand'] as const).map((l) => (
            <button key={l} type="button" onClick={() => setForm({ ...form, default_layout: l })} className={`px-4 py-1.5 rounded-lg ${form.default_layout === l ? 'bg-white shadow-sm text-violet-700' : 'text-slate-500'}`}>
              {l === 'simple' ? 'Sobre' : 'Illustré'}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.quote_original} onChange={(e) => setForm({ ...form, quote_original: e.target.checked })} className="accent-violet-600" />
        Citer le message d’origine sous les réponses
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.ai_enabled} onChange={(e) => setForm({ ...form, ai_enabled: e.target.checked })} className="accent-violet-600 mt-1" />
        <span>
          Utiliser l’IA (Claude) pour classer les emails incertains, les résumer en une ligne et proposer des brouillons
          {!aiAvailable && <span className="block text-[11px] text-amber-700">Indisponible : la variable ANTHROPIC_API_KEY n’est pas configurée sur le serveur.</span>}
        </span>
      </label>
      <div>
        <span className="text-sm font-medium text-slate-800">Notifier sur la cloche admin</span>
        <p className="text-[11px] text-slate-500 mb-2">Pour les nouveaux emails à traiter de ces catégories (et pour tout email d’un client).</p>
        <div className="flex flex-wrap gap-2">
          {INBOX_CATEGORIES.filter((c) => c !== 'spam' && c !== 'notification').map((c) => {
            const on = form.notify_categories.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, notify_categories: on ? form.notify_categories.filter((x) => x !== c) : [...form.notify_categories, c] })}
                className={`px-3 py-1.5 rounded-full text-xs ring-1 ring-inset ${on ? CATEGORY_STYLE[c].pill : 'bg-white text-slate-500 ring-slate-200'}`}
              >
                {CATEGORY_LABELS[c]}
              </button>
            )
          })}
        </div>
      </div>
      {err && <p className="text-xs text-rose-600">{err}</p>}
      <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saved ? 'Enregistré' : 'Enregistrer'}
      </button>
    </div>
  )
}

export default function SettingsDrawer(props: Props) {
  const [tab, setTab] = useState<Tab>(props.initialTab || 'templates')
  useEffect(() => {
    if (props.open && props.initialTab) setTab(props.initialTab)
  }, [props.open, props.initialTab])
  if (!props.open) return null

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'templates', label: 'Modèles', icon: FileText },
    { key: 'rules', label: 'Classement', icon: Filter },
    { key: 'settings', label: 'Signature et envoi', icon: Settings2 },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={props.onClose}>
      <div className="w-full max-w-5xl h-full bg-slate-50 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200 bg-white">
          <h2 className="text-base font-semibold text-slate-900 mr-4">Réglages de la boîte mail</h2>
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm whitespace-nowrap ${tab === t.key ? 'bg-violet-100 text-violet-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={props.onClose} className="ml-auto p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0 p-5">
          {tab === 'templates' && <TemplatesTab templates={props.templates} settings={props.settings} onChange={props.onTemplatesChange} />}
          {tab === 'rules' && <RulesTab onReclassified={props.onReclassified} />}
          {tab === 'settings' && <SettingsTab settings={props.settings} aiAvailable={props.aiAvailable} onChange={props.onSettingsChange} />}
        </div>
      </div>
    </div>
  )
}
