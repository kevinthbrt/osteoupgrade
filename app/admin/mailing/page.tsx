'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  FileText,
  Loader2,
  Mail,
  Megaphone,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
  X
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import NewsletterEditor from '@/components/newsletter/NewsletterEditor'
import { supabase } from '@/lib/supabase'
import {
  coerceDoc,
  describeBlockers,
  emptyDoc,
  MERGE_TAGS,
  renderNewsletterHtml,
  type AudienceKind,
  type DeliveryMode,
  type NewsletterDoc
} from '@/lib/newsletter'

/**
 * Administration → Newsletter.
 *
 * Cette page ne sert qu'à une chose : écrire la newsletter du mois et l'envoyer.
 * Pas de HTML, pas de gabarits à choisir, pas d'automatisations : les séquences
 * déclenchées par les événements vivent dans Administration → Automatisations,
 * et le gabarit de l'email est appliqué tout seul (`lib/newsletter.ts`).
 *
 * Le contenu est enregistré en continu côté serveur : on peut fermer l'onglet
 * au milieu d'un paragraphe et reprendre depuis une autre machine.
 */

type NewsletterSummary = {
  id: string
  title: string
  subject: string
  status: 'draft' | 'sent'
  audience: AudienceKind
  subscription_filter: string | null
  delivery_mode: DeliveryMode
  sent_at: string | null
  sent_count: number | null
  updated_at: string
}

const PLAN_OPTIONS: { value: string; label: string }[] = [
  { value: 'bundle', label: 'Offre Premium (les deux outils)' },
  { value: 'osteoflow', label: 'Offre MyOsteoFlow seule' },
  { value: 'osteoupgrade', label: 'Offre OsteoUpgrade seule' },
  { value: 'free', label: 'Comptes gratuits' }
]

const AUDIENCE_LABELS: Record<AudienceKind, string> = {
  all: 'Tous les inscrits à la newsletter',
  plan: 'Une offre en particulier',
  prelaunch: 'Contacts pré-lancement',
  test: 'Adresses saisies à la main'
}

export default function NewsletterAdminPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<NewsletterSummary[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [doc, setDoc] = useState<NewsletterDoc>(emptyDoc())
  const [status, setStatus] = useState<'draft' | 'sent'>('draft')

  const [audience, setAudience] = useState<AudienceKind>('all')
  const [planFilter, setPlanFilter] = useState('bundle')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('marketing')
  const [audienceCount, setAudienceCount] = useState<number | null>(null)

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [sending, setSending] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [testRecipients, setTestRecipients] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const lastEditable = useRef<HTMLElement | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)
  const readOnly = status === 'sent'

  // ── Chargement ───────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const summaries = await fetchList()
      if (cancelled) return

      const draft = summaries.find((item) => item.status === 'draft')
      if (draft) {
        await openNewsletter(draft.id)
      } else {
        await createNewsletter()
      }
      if (!cancelled) setLoading(false)
    }

    boot()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Les balises de personnalisation s'insèrent là où on écrivait juste avant.
  useEffect(() => {
    const remember = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable) lastEditable.current = target
    }
    document.addEventListener('focusin', remember)
    return () => document.removeEventListener('focusin', remember)
  }, [])

  const fetchList = useCallback(async () => {
    const response = await fetch('/api/admin/newsletters')
    const data = await response.json()
    const summaries: NewsletterSummary[] = data.newsletters || []
    setList(summaries)
    return summaries
  }, [])

  const openNewsletter = useCallback(async (id: string) => {
    const response = await fetch(`/api/admin/newsletters/${id}`)
    const data = await response.json()
    if (!response.ok) {
      setNotice({ type: 'error', message: data.error || 'Impossible d’ouvrir cette newsletter' })
      return
    }
    const record = data.newsletter
    setCurrentId(record.id)
    setTitle(record.title)
    setDoc(coerceDoc(record))
    setStatus(record.status)
    setAudience(record.audience)
    setPlanFilter(record.audience === 'plan' && record.subscription_filter ? record.subscription_filter : 'bundle')
    setDeliveryMode(record.delivery_mode)
    setSavedAt(null)
    dirty.current = false
    setDrawerOpen(false)
  }, [])

  const createNewsletter = useCallback(
    async (duplicateOf?: string) => {
      const response = await fetch('/api/admin/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateOf ? { duplicateOf } : {})
      })
      const data = await response.json()
      if (!response.ok) {
        setNotice({ type: 'error', message: data.error || 'Création impossible' })
        return
      }
      await fetchList()
      await openNewsletter(data.newsletter.id)
    },
    [fetchList, openNewsletter]
  )

  // ── Enregistrement ───────────────────────────────────────────────────────

  const save = useCallback(async () => {
    if (!currentId || readOnly) return
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/newsletters/${currentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subject: doc.subject,
          preheader: doc.preheader,
          header: doc.header,
          blocks: doc.blocks,
          audience,
          subscriptionFilter: audience === 'plan' ? planFilter : null,
          deliveryMode
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Enregistrement impossible')
      dirty.current = false
      setSavedAt(new Date())
      setList((prev) => prev.map((item) => (item.id === currentId ? { ...item, title, subject: doc.subject } : item)))
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }, [audience, currentId, deliveryMode, doc, planFilter, readOnly, title])

  // Enregistrement différé : on écrit une seconde et demie après la dernière frappe.
  useEffect(() => {
    if (!currentId || loading || readOnly) return
    if (!dirty.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      save()
    }, 1500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [doc, title, audience, planFilter, deliveryMode, currentId, loading, readOnly, save])

  const patchDoc = (next: NewsletterDoc) => {
    dirty.current = true
    setDoc(next)
  }

  // Les réglages de diffusion font partie du brouillon : les changer doit
  // déclencher l'enregistrement différé comme une frappe dans le texte.
  const chooseAudience = (value: AudienceKind) => {
    dirty.current = true
    setAudience(value)
  }
  const choosePlan = (value: string) => {
    dirty.current = true
    setPlanFilter(value)
  }
  const chooseDeliveryMode = (value: DeliveryMode) => {
    dirty.current = true
    setDeliveryMode(value)
  }

  // ── Compte des destinataires ─────────────────────────────────────────────

  useEffect(() => {
    if (audience === 'test') {
      setAudienceCount(null)
      return
    }
    let cancelled = false
    const params = new URLSearchParams({ audience })
    if (audience === 'plan') params.set('filter', planFilter)

    setAudienceCount(null)
    fetch(`/api/admin/newsletter-audience?${params}`)
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && typeof data.count === 'number') setAudienceCount(data.count)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [audience, planFilter])

  // ── Envoi ────────────────────────────────────────────────────────────────

  const blockers = useMemo(() => describeBlockers(doc), [doc])

  const sendTest = async () => {
    const recipients = testRecipients
      .split(/[,;\n]/)
      .map((email) => email.trim())
      .filter(Boolean)

    if (!recipients.length) {
      setNotice({ type: 'error', message: 'Indiquez au moins une adresse de test.' })
      return
    }

    setSending(true)
    try {
      if (dirty.current) await save()
      const response = await fetch('/api/mailing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletterId: currentId, audience: 'test', to: recipients })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Envoi impossible')
      setTestOpen(false)
      setNotice({
        type: 'success',
        message: `Test envoyé à ${data.sent} adresse${data.sent > 1 ? 's' : ''}. Les balises de personnalisation y sont remplacées par les vraies valeurs.`
      })
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setSending(false)
    }
  }

  const sendNewsletter = async () => {
    setSending(true)
    try {
      if (dirty.current) await save()
      const response = await fetch('/api/mailing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletterId: currentId,
          audience,
          subscriptionFilter: audience === 'plan' ? planFilter : undefined,
          deliveryMode
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Envoi impossible')

      setConfirmOpen(false)
      setStatus('sent')
      await fetchList()

      if (data.mode === 'broadcast') {
        const failures = data.syncErrors?.length || 0
        setNotice({
          type: 'success',
          message:
            `Newsletter partie en campagne à ${data.totalContacts} destinataire${data.totalContacts > 1 ? 's' : ''}.` +
            (failures > 0 ? ` ${failures} contact(s) n’ont pas pu être synchronisés, voir la console.` : '')
        })
        if (failures > 0) console.error('Échecs de synchronisation Resend :', data.syncErrors)
      } else {
        const failures = data.total - data.sent
        setNotice({
          type: 'success',
          message:
            `Newsletter envoyée à ${data.sent}/${data.total} destinataire${data.total > 1 ? 's' : ''}.` +
            (failures > 0 ? ` ${failures} échec(s), voir la console.` : '')
        })
        if (failures > 0) console.error('Échecs d’envoi :', data.errors)
      }
    } catch (error: any) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setSending(false)
    }
  }

  const removeNewsletter = async (id: string) => {
    if (!confirm('Supprimer définitivement cette newsletter ?')) return
    const response = await fetch(`/api/admin/newsletters/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      setNotice({ type: 'error', message: 'Suppression impossible' })
      return
    }
    const summaries = await fetchList()
    if (id === currentId) {
      const next = summaries.find((item) => item.status === 'draft')
      if (next) await openNewsletter(next.id)
      else await createNewsletter()
    }
  }

  const insertMergeTag = (tag: string) => {
    const target = lastEditable.current
    if (!target) {
      setNotice({ type: 'error', message: 'Cliquez d’abord dans un bloc de texte, puis choisissez la balise.' })
      return
    }
    target.focus()
    document.execCommand('insertText', false, tag)
    target.dispatchEvent(new Event('input', { bubbles: true }))
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </div>
      </AuthLayout>
    )
  }

  const previewHtml = renderNewsletterHtml(doc, {
    previewContact: { email: 'confrere@exemple.fr', firstName: 'Camille', lastName: 'Durand' }
  })

  return (
    <AuthLayout>
      <div className="-m-6 min-h-screen md:-m-8">
        {/* Bandeau */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 pb-6 pt-8 md:px-10">
          <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/4 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="relative">
            <AdminBackButton />
            <div className="rounded-3xl border border-white/20 bg-white/[0.09] p-6 shadow-[0_12px_40px_rgba(0,8,30,0.65)] ring-1 ring-inset ring-white/15 backdrop-blur-xl md:p-8">
              <p className="mb-1 flex items-center gap-2 text-sm font-medium tracking-wide text-purple-300">
                <Mail className="h-4 w-4" /> Admin : Newsletter
              </p>
              <h1 className="bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
                La newsletter du mois
              </h1>
              <p className="mt-1.5 text-sm text-blue-300/70">
                Empilez des blocs, écrivez dedans, choisissez à qui vous l’envoyez. Aucune ligne de code.
              </p>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div className="relative bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-4 pb-16 pt-6 md:px-10">
          <div className="relative mx-auto max-w-6xl space-y-6">
            {notice && (
              <div
                className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
                  notice.type === 'success'
                    ? 'border-emerald-200/60 bg-emerald-50/80 text-emerald-800'
                    : 'border-red-200/60 bg-red-50/80 text-red-800'
                }`}
              >
                <span className="text-sm">{notice.message}</span>
                <button onClick={() => setNotice(null)} aria-label="Fermer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Barre d'actions */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-lg backdrop-blur-2xl">
              <input
                value={title}
                onChange={(event) => {
                  dirty.current = true
                  setTitle(event.target.value)
                }}
                disabled={readOnly}
                aria-label="Nom de la newsletter"
                className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1.5 text-lg font-bold text-slate-900 outline-none transition hover:border-slate-200 focus:border-violet-300"
              />

              <span className="text-xs text-slate-400">
                {readOnly ? 'Envoyée' : saving ? 'Enregistrement…' : savedAt ? `Enregistré à ${savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>

              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200/60 bg-white/70 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                <FileText className="h-4 w-4" />
                Mes newsletters
              </button>

              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Eye className="h-4 w-4" />
                Aperçu
              </button>
            </div>

            {readOnly && (
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <Check className="h-5 w-5 flex-shrink-0" />
                <p>
                  Cette newsletter a déjà été envoyée, elle n’est plus modifiable. Pour repartir de son contenu,
                  ouvrez « Mes newsletters » puis « Dupliquer ».
                </p>
              </div>
            )}

            {/* 1. L'objet */}
            <Section number={1} title="Ce que le lecteur voit avant d’ouvrir">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Objet de l’email</span>
                  <input
                    value={doc.subject}
                    onChange={(event) => patchDoc({ ...doc, subject: event.target.value })}
                    disabled={readOnly}
                    placeholder="La newsletter OsteoUpgrade de septembre"
                    className="w-full rounded-xl border border-blue-200/60 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Aperçu dans la boîte de réception
                  </span>
                  <input
                    value={doc.preheader}
                    onChange={(event) => patchDoc({ ...doc, preheader: event.target.value })}
                    disabled={readOnly}
                    placeholder="La ligne grise affichée à côté de l’objet"
                    className="w-full rounded-xl border border-blue-200/60 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 p-4">
                <p className="text-sm font-semibold text-violet-900">Appeler chaque lecteur par son prénom</p>
                <p className="mt-1 text-sm leading-relaxed text-violet-800/80">
                  Cliquez dans un bloc de texte, puis choisissez une étiquette : elle sera remplacée par les
                  informations du destinataire au moment de l’envoi.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MERGE_TAGS.map((tag) => (
                    <button
                      key={tag.tag}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertMergeTag(tag.tag)}
                      disabled={readOnly}
                      title={tag.help}
                      className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-800 transition hover:bg-violet-100 disabled:opacity-50"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            {/* 2. Le contenu */}
            <Section number={2} title="Le contenu">
              <NewsletterEditor doc={doc} onChange={patchDoc} disabled={readOnly} />
            </Section>

            {/* 3. La diffusion */}
            <Section number={3} title="À qui, et comment">
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">La liste de diffusion</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ChoiceCard
                      active={audience === 'all'}
                      disabled={readOnly}
                      onClick={() => chooseAudience('all')}
                      icon={<Users className="h-4 w-4" />}
                      title="Tous les inscrits à la newsletter"
                      description="Tous les comptes qui ont accepté de la recevoir."
                    />
                    <ChoiceCard
                      active={audience === 'plan'}
                      disabled={readOnly}
                      onClick={() => chooseAudience('plan')}
                      icon={<Users className="h-4 w-4" />}
                      title="Une offre en particulier"
                      description="Les abonnés d’une offre, ou les comptes gratuits."
                    />
                    <ChoiceCard
                      active={audience === 'prelaunch'}
                      disabled={readOnly}
                      onClick={() => chooseAudience('prelaunch')}
                      icon={<Sparkles className="h-4 w-4" />}
                      title="Contacts pré-lancement"
                      description="Les personnes inscrites par un funnel, sans compte."
                    />
                    <ChoiceCard
                      active={audience === 'test'}
                      disabled={readOnly}
                      onClick={() => chooseAudience('test')}
                      icon={<Mail className="h-4 w-4" />}
                      title="Adresses saisies à la main"
                      description="Pour écrire à quelques personnes précises."
                    />
                  </div>

                  {audience === 'plan' && (
                    <select
                      value={planFilter}
                      onChange={(event) => choosePlan(event.target.value)}
                      disabled={readOnly}
                      className="mt-3 w-full rounded-xl border border-blue-200/60 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-300"
                    >
                      {PLAN_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {audience === 'test' && (
                    <textarea
                      value={testRecipients}
                      onChange={(event) => setTestRecipients(event.target.value)}
                      disabled={readOnly}
                      rows={2}
                      placeholder="prenom@exemple.fr, autre@exemple.fr"
                      className="mt-3 w-full rounded-xl border border-blue-200/60 bg-white/70 px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-300"
                    />
                  )}

                  {audience !== 'test' && (
                    <p className="mt-2 text-sm text-slate-500">
                      {audienceCount === null ? (
                        'Comptage des destinataires…'
                      ) : (
                        <>
                          <strong className="text-slate-700">{audienceCount}</strong> destinataire
                          {audienceCount > 1 ? 's' : ''} dans cette liste.
                        </>
                      )}
                    </p>
                  )}
                </div>

                {audience !== 'test' && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">La façon d’envoyer</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <ChoiceCard
                        active={deliveryMode === 'marketing'}
                        disabled={readOnly}
                        onClick={() => chooseDeliveryMode('marketing')}
                        icon={<Megaphone className="h-4 w-4" />}
                        title="Campagne (commercial)"
                        description="Le bon choix pour une newsletter. Un envoi groupé, avec un bouton « se désinscrire » en un clic, sur le quota marketing. Les prénoms sont personnalisés par Resend."
                      />
                      <ChoiceCard
                        active={deliveryMode === 'direct'}
                        disabled={readOnly}
                        onClick={() => chooseDeliveryMode('direct')}
                        icon={<Send className="h-4 w-4" />}
                        title="Envoi direct (transactionnel)"
                        description="Un message à la fois, comme un email de facture. Réservé aux petites listes : il consomme le quota des emails critiques (bienvenue, factures)."
                      />
                    </div>
                    {deliveryMode === 'direct' && (
                      <p className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        L’envoi direct s’arrête à 200 destinataires, et il est déconseillé pour une newsletter :
                        un abonné qui la signale comme indésirable abîme la réputation de l’adresse qui envoie
                        aussi vos factures.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Section>

            {/* Envoi */}
            <div className="rounded-2xl border border-white/70 bg-white/85 p-6 shadow-lg backdrop-blur-2xl">
              {blockers.length > 0 && (
                <ul className="mb-4 space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  {blockers.map((problem) => (
                    <li key={problem} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      {problem}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTestOpen(true)}
                  disabled={readOnly || blockers.length > 0 || sending}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200/60 bg-white/70 px-5 py-3 font-semibold text-slate-700 transition hover:bg-white disabled:opacity-50"
                >
                  <Mail className="h-4 w-4" />
                  Se l’envoyer pour relire
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={readOnly || blockers.length > 0 || sending}
                  className="inline-flex items-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/90 px-6 py-3 text-lg font-semibold text-white shadow-sm transition hover:bg-purple-600/90 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  Envoyer la newsletter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tiroir : les newsletters */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
          <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Mes newsletters</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="border-b border-slate-100 p-4">
              <button
                type="button"
                onClick={() => createNewsletter()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500/90 px-4 py-2.5 font-semibold text-white transition hover:bg-purple-600/90"
              >
                <Plus className="h-4 w-4" />
                Nouvelle newsletter
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {list.map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-slate-100 px-6 py-4 ${item.id === currentId ? 'bg-violet-50' : ''}`}
                >
                  <button type="button" onClick={() => openNewsletter(item.id)} className="block w-full text-left">
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="truncate text-sm text-slate-500">{item.subject || 'Sans objet'}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.status === 'sent'
                        ? `Envoyée le ${new Date(item.sent_at || item.updated_at).toLocaleDateString('fr-FR')} à ${item.sent_count ?? '?'} personnes`
                        : `Brouillon, modifié le ${new Date(item.updated_at).toLocaleDateString('fr-FR')}`}
                    </p>
                  </button>
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => createNewsletter(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
                    >
                      <Copy className="h-3 w-3" />
                      Dupliquer
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNewsletter(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {list.length === 0 && <p className="p-6 text-center text-sm text-slate-400">Aucune newsletter pour l’instant.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Aperçu */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Aperçu</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Objet : <span className="font-medium text-slate-700">{doc.subject || '(vide)'}</span>. Les
                  étiquettes de personnalisation sont remplacées par un exemple.
                </p>
              </div>
              <button onClick={() => setPreviewOpen(false)} aria-label="Fermer">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <iframe srcDoc={previewHtml} className="flex-1 border-0" sandbox="" title="Aperçu de la newsletter" />
          </div>
        </div>
      )}

      {/* Envoi de test */}
      {testOpen && (
        <Modal onClose={() => setTestOpen(false)} title="Se l’envoyer pour relire">
          <p className="text-sm leading-relaxed text-slate-600">
            La newsletter part telle quelle à ces adresses, sans toucher à votre liste de diffusion.
          </p>
          <textarea
            value={testRecipients}
            onChange={(event) => setTestRecipients(event.target.value)}
            rows={3}
            placeholder="votre@adresse.fr"
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-300"
          />
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setTestOpen(false)} className="rounded-xl px-4 py-2.5 font-semibold text-slate-500">
              Annuler
            </button>
            <button
              type="button"
              onClick={sendTest}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500/90 px-5 py-2.5 font-semibold text-white transition hover:bg-purple-600/90 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer le test
            </button>
          </div>
        </Modal>
      )}

      {/* Confirmation d'envoi */}
      {confirmOpen && (
        <Modal onClose={() => setConfirmOpen(false)} title="Envoyer la newsletter ?">
          <dl className="space-y-3 text-sm">
            <Row label="Objet" value={doc.subject} />
            <Row
              label="Liste"
              value={
                audience === 'plan'
                  ? PLAN_OPTIONS.find((option) => option.value === planFilter)?.label || planFilter
                  : AUDIENCE_LABELS[audience]
              }
            />
            <Row
              label="Destinataires"
              value={audience === 'test' ? testRecipients || '(aucune adresse)' : `${audienceCount ?? '…'} personnes`}
            />
            <Row
              label="Mode"
              value={deliveryMode === 'marketing' ? 'Campagne (commercial)' : 'Envoi direct (transactionnel)'}
            />
          </dl>
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Un envoi ne se rattrape pas. Relisez l’aperçu si vous avez un doute.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl px-4 py-2.5 font-semibold text-slate-500">
              Annuler
            </button>
            <button
              type="button"
              onClick={sendNewsletter}
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500/90 px-5 py-2.5 font-semibold text-white transition hover:bg-purple-600/90 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirmer l’envoi
            </button>
          </div>
        </Modal>
      )}
    </AuthLayout>
  )
}

// ── Petits éléments d'interface ─────────────────────────────────────────────

function Section({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/70 bg-white/85 p-6 shadow-lg backdrop-blur-2xl">
      <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-slate-900">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function ChoiceCard({
  active,
  disabled,
  onClick,
  icon,
  title,
  description
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border p-4 text-left transition disabled:opacity-60 ${
        active ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-300' : 'border-slate-200 bg-white/70 hover:border-violet-200'
      }`}
    >
      <span className={`flex items-center gap-2 font-semibold ${active ? 'text-violet-800' : 'text-slate-700'}`}>
        {icon}
        {title}
      </span>
      <span className="mt-1 block text-sm leading-relaxed text-slate-500">{description}</span>
    </button>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Fermer">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 flex-shrink-0 text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{value || '(vide)'}</dd>
    </div>
  )
}
