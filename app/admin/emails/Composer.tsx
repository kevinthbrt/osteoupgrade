'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown, Eye, EyeOff, FileText, Loader2, Quote, Send, Sparkles, Wand2, X, CheckCircle2,
} from 'lucide-react'
import {
  CATEGORY_LABELS,
  guessFirstName,
  mergeVariables,
  renderReplyHtml,
  replySubject,
} from '@/lib/inbox-render'
import { planLabel, planOf } from '@/lib/entitlements'
import { api, type InboxCategory, type InboxLayout, type InboxSettings, type InboxTemplate, type ThreadDetail } from './inbox-types'

const VARIABLES = [
  { key: 'prenom', label: 'Prénom' },
  { key: 'nom', label: 'Nom' },
  { key: 'offre', label: 'Offre' },
  { key: 'email', label: 'Email' },
]

interface Props {
  mode: 'reply' | 'new'
  detail?: ThreadDetail | null
  templates: InboxTemplate[]
  settings: InboxSettings
  aiAvailable: boolean
  onSent: (result: { status?: string; threadId?: string }) => void
  onCancel?: () => void
  autoFocus?: boolean
}

/**
 * Composeur : modèle, gabarit, brouillon IA, aperçu fidèle de l'email envoyé.
 * La signature et la citation sont ajoutées au rendu, jamais dans le texte
 * saisi : on ne les efface pas par erreur, et on ne les envoie pas deux fois.
 */
export default function Composer({ mode, detail, templates, settings, aiAvailable, onSent, onCancel, autoFocus }: Props) {
  const tete = detail?.thread
  const category = tete?.category as InboxCategory | undefined

  // Pour nos formulaires internes (expéditeur no-reply@osteo-upgrade.fr), la
  // vraie personne à qui répondre est citée dans le corps : « De : adresse ».
  const [to, setTo] = useState(() => {
    if (mode !== 'reply' || !tete) return ''
    if (tete.from_email.toLowerCase().endsWith('@osteo-upgrade.fr')) {
      const m = (tete.text_content || '').match(/De\s*:\s*([^\s@<>]+@[^\s@<>]+\.[a-z]{2,})/i)
      if (m) return m[1]
    }
    return tete.from_email
  })
  const [editTo, setEditTo] = useState(false)
  const [subject, setSubject] = useState(mode === 'reply' && tete ? replySubject(tete.subject || '') : '')
  const [body, setBody] = useState('')
  const [layout, setLayout] = useState<InboxLayout>(settings.default_layout)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [emoji, setEmoji] = useState<string>('✉️')
  const [bannerTitle, setBannerTitle] = useState('')
  const aDesMessages = Boolean(detail?.messages.length)
  const [includeQuote, setIncludeQuote] = useState(settings.quote_original && Boolean(detail?.messages.length))
  const [preview, setPreview] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [showAi, setShowAi] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState<null | 'waiting' | 'done'>(null)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const draftKey = mode === 'reply' && tete ? `inbox-draft:${tete.thread_id}` : 'inbox-draft:new'

  // Brouillon local : changer de conversation ne fait pas perdre une réponse
  // en cours d'écriture.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey)
      if (saved) setBody(saved)
    } catch {}
    if (autoFocus) setTimeout(() => textareaRef.current?.focus(), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey])

  useEffect(() => {
    try {
      if (body.trim()) localStorage.setItem(draftKey, body)
      else localStorage.removeItem(draftKey)
    } catch {}
  }, [body, draftKey])

  const sortedTemplates = useMemo(() => {
    const suggeres = templates.filter((t) => category && t.category === category)
    const autres = templates.filter((t) => !(category && t.category === category))
    return { suggeres, autres }
  }, [templates, category])

  const profile = detail?.profile
  const nomComplet = profile?.full_name || tete?.from_name || null
  const merge = {
    prenom: guessFirstName(nomComplet),
    nom: nomComplet,
    email: mode === 'reply' ? tete?.from_email : to,
    offre: profile ? planLabel(planOf(profile as any)) : null,
  }

  const previewHtml = useMemo(() => {
    if (!preview) return ''
    const quoteText = tete ? tete.text_content || '' : ''
    return renderReplyHtml({
      body: mergeVariables(body || 'Votre message…', merge),
      signature: settings.signature,
      layout,
      subject: subject || '(sans objet)',
      emoji,
      bannerTitle,
      quote:
        mode === 'reply' && includeQuote && tete
          ? { fromName: tete.from_name, fromEmail: tete.from_email, receivedAt: tete.received_at, text: quoteText }
          : null,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, body, layout, subject, emoji, bannerTitle, includeQuote, settings.signature, tete, mode, to])

  function applyTemplate(t: InboxTemplate) {
    if (body.trim() && !confirm('Remplacer le texte en cours par ce modèle ?')) return
    setBody(t.body)
    setLayout(t.layout)
    setTemplateId(t.id)
    if (t.emoji) setEmoji(t.emoji)
    setBannerTitle(t.banner_title || '')
    if (t.subject) setSubject(mode === 'reply' ? replySubject(t.subject) : t.subject)
    setShowTemplates(false)
    setTimeout(() => textareaRef.current?.focus(), 30)
  }

  function insertVariable(key: string) {
    const el = textareaRef.current
    const token = `{{${key}}}`
    if (!el) return setBody((b) => b + token)
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = body.slice(0, start) + token + body.slice(end)
    setBody(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    }, 0)
  }

  async function generateDraft() {
    if (!tete) return
    if (body.trim() && !confirm('Remplacer le texte en cours par le brouillon de l’IA ?')) return
    setDrafting(true)
    setError(null)
    try {
      const tpl = templates.find((t) => t.id === templateId)
      const { draft } = await api<{ draft: string }>(`/api/admin/inbox/${tete.thread_id}/draft`, {
        method: 'POST',
        json: { instruction, templateBody: tpl?.body },
      })
      setBody(draft)
      setShowAi(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDrafting(false)
    }
  }

  async function send(markAs: 'waiting' | 'done') {
    if (!body.trim()) return
    setSending(markAs)
    setError(null)
    try {
      if (mode === 'reply' && tete) {
        const res = await api<{ status: string }>(`/api/admin/inbox/${tete.thread_id}/reply`, {
          method: 'POST',
          json: { body, subject, to, layout, templateId, includeQuote, markAs, emoji, bannerTitle },
        })
        setBody('')
        try { localStorage.removeItem(draftKey) } catch {}
        onSent({ status: res.status })
      } else {
        const res = await api<{ threadId: string }>('/api/admin/inbox/compose', {
          method: 'POST',
          json: { to, subject, body, layout, templateId, emoji, bannerTitle },
        })
        setBody('')
        try { localStorage.removeItem(draftKey) } catch {}
        onSent({ threadId: res.threadId })
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(null)
    }
  }

  const aCompleter = /\[À COMPLÉTER/i.test(body)
  const peutEnvoyer = body.trim() && !aCompleter && to.trim() && (mode === 'reply' || subject)

  return (
    <div
      className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && peutEnvoyer && !sending) {
          e.preventDefault()
          send('waiting')
        }
      }}
    >
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-slate-50/60">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition"
          >
            <FileText className="h-3.5 w-3.5 text-violet-600" />
            {templates.find((t) => t.id === templateId)?.name || 'Modèles'}
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
          {showTemplates && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowTemplates(false)} />
              <div className="absolute left-0 top-full mt-1 z-40 w-80 max-h-80 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-xl p-1.5">
                {sortedTemplates.suggeres.length > 0 && (
                  <p className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                    Suggérés pour {CATEGORY_LABELS[category!]}
                  </p>
                )}
                {[...sortedTemplates.suggeres, ...sortedTemplates.autres].map((t, i) => (
                  <div key={t.id}>
                    {i === sortedTemplates.suggeres.length && sortedTemplates.suggeres.length > 0 && (
                      <p className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Autres modèles</p>
                    )}
                    <button
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-violet-50 transition"
                    >
                      <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                        {t.name}
                        {t.layout === 'brand' && <span className="text-[9px] px-1 py-0.5 rounded bg-violet-100 text-violet-700">illustré</span>}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{t.body.replace(/\s+/g, ' ')}</p>
                    </button>
                  </div>
                ))}
                {templates.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">Aucun modèle. Créez-en dans les réglages.</p>}
              </div>
            </>
          )}
        </div>

        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 text-[11px] font-medium">
          {(['simple', 'brand'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLayout(l)}
              className={`px-2.5 py-1 rounded-md transition ${layout === l ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {l === 'simple' ? 'Sobre' : 'Illustré'}
            </button>
          ))}
        </div>

        {mode === 'reply' && aDesMessages && (
          <button
            type="button"
            onClick={() => setIncludeQuote((v) => !v)}
            title="Citer le message d’origine sous la réponse"
            className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition ${includeQuote ? 'text-violet-700 bg-violet-50' : 'text-slate-500 hover:bg-white'}`}
          >
            <Quote className="h-3.5 w-3.5" /> Citation
          </button>
        )}

        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition ${preview ? 'text-violet-700 bg-violet-50' : 'text-slate-500 hover:bg-white'}`}
        >
          {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} Aperçu
        </button>

        {mode === 'reply' && aDesMessages && aiAvailable && settings.ai_enabled && (
          <button
            type="button"
            onClick={() => setShowAi((v) => !v)}
            className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-sm transition"
          >
            <Sparkles className="h-3.5 w-3.5" /> Brouillon IA
          </button>
        )}
        {onCancel && (
          <button type="button" onClick={onCancel} className={`${mode === 'reply' && aiAvailable ? '' : 'ml-auto'} p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white`}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showAi && (
        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50/70 border-b border-violet-100">
          <Wand2 className="h-4 w-4 text-violet-500 shrink-0" />
          <input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !drafting && generateDraft()}
            placeholder="Consigne facultative : « propose-lui un appel », « dis-lui que c’est corrigé »…"
            className="flex-1 bg-white text-xs px-3 py-2 rounded-lg border border-violet-200 outline-none focus:ring-2 focus:ring-violet-300"
          />
          <button
            type="button"
            onClick={generateDraft}
            disabled={drafting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60"
          >
            {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {drafting ? 'Rédaction…' : 'Rédiger'}
          </button>
        </div>
      )}

      {(mode === 'new' || editTo || to !== tete?.from_email) && (
        <div className="px-4 pt-3 space-y-2">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Destinataire"
            className="w-full text-sm px-0 py-1.5 border-0 border-b border-slate-100 outline-none focus:border-violet-300"
          />
        </div>
      )}
      <div className="px-4 pt-2">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Objet"
          className="w-full text-sm font-medium px-0 py-1.5 border-0 border-b border-slate-100 outline-none focus:border-violet-300 text-slate-800"
        />
      </div>
      {layout === 'brand' && (
        <div className="flex gap-2 px-4 pt-2">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-12 text-center text-sm py-1 border border-slate-200 rounded-lg" title="Emoji du bandeau" />
          <input
            value={bannerTitle}
            onChange={(e) => setBannerTitle(e.target.value)}
            placeholder="Titre du bandeau (par défaut : l’objet)"
            className="flex-1 text-xs px-2.5 py-1 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-200"
          />
        </div>
      )}

      {preview ? (
        <div className="m-3 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
          <iframe title="Aperçu" srcDoc={previewHtml} sandbox="" className="w-full h-[420px] bg-white" />
        </div>
      ) : (
        <div className="px-4 pt-2">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={mode === 'new' ? 12 : 8}
            placeholder={mode === 'reply' ? 'Écrire la réponse… (Ctrl + Entrée pour envoyer)' : 'Votre message…'}
            className="w-full text-sm leading-relaxed resize-y outline-none text-slate-800 placeholder:text-slate-400 min-h-[140px]"
          />
          <div className="flex flex-wrap items-center gap-1 pb-2">
            <span className="text-[10px] text-slate-400 mr-1">Insérer :</span>
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700 font-mono"
              >
                {`{{${v.key}}}`}
              </button>
            ))}
          </div>
          <div className="border-t border-dashed border-slate-200 py-2 text-xs text-slate-400 whitespace-pre-line">
            {settings.signature || 'Aucune signature'}
            <span className="ml-2 text-[10px] italic">(signature ajoutée automatiquement)</span>
          </div>
        </div>
      )}

      {(error || aCompleter) && (
        <p className="mx-4 mb-2 text-xs px-3 py-2 rounded-lg bg-rose-50 text-rose-700">
          {error || 'Complétez les passages « [À COMPLÉTER …] » avant d’envoyer.'}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-slate-100 bg-slate-50/60">
        {mode === 'reply' && (
          <span className="mr-auto text-[11px] text-slate-400 hidden sm:block">
            À : {to}
            {to === tete?.from_email && (
              <button type="button" onClick={() => setEditTo(true)} className="ml-2 underline hover:text-violet-600">modifier</button>
            )}
          </span>
        )}
        {mode === 'reply' && (
          <button
            type="button"
            onClick={() => send('done')}
            disabled={!peutEnvoyer || !!sending}
            title="Envoyer et marquer la conversation comme traitée"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50"
          >
            {sending === 'done' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Envoyer et clore
          </button>
        )}
        <button
          type="button"
          onClick={() => send('waiting')}
          disabled={!peutEnvoyer || !!sending}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 shadow-sm disabled:opacity-50"
        >
          {sending === 'waiting' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Envoyer
        </button>
      </div>
    </div>
  )
}
