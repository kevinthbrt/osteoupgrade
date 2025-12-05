'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  FilePlus2,
  Flame,
  Image as ImageIcon,
  Loader2,
  Mail,
  PlayCircle,
  Rocket,
  Send,
  Shield,
  Sparkles,
  Trash2,
  Wand2
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { supabase } from '@/lib/supabase'

type Template = {
  id: string
  name: string
  subject: string
  description: string
  html: string
  text?: string
}

type Automation = {
  id: string
  name: string
  trigger: string
  audience: string
  schedule: string
  active: boolean
}

const defaultTemplates: Template[] = [
  {
    id: 'welcome',
    name: 'Bienvenue Premium',
    subject: 'Bienvenue sur OsteoUpgrade 🎉',
    description: 'Email d’accueil avec liens vers les modules principaux.',
    html: `
      <div style="font-family: Inter, sans-serif; color: #0f172a;">
        <h1 style="color:#7c3aed;">Bienvenue sur OsteoUpgrade !</h1>
        <p>Nous sommes ravis de vous compter parmi nous. Retrouvez dès maintenant :</p>
        <ul>
          <li>👉 Les consultations guidées V3</li>
          <li>👉 La bibliothèque de tests orthopédiques</li>
          <li>👉 Les rappels email automatisés</li>
        </ul>
        <p style="margin-top:16px;">À très vite,</p>
        <p><strong>L’équipe OsteoUpgrade</strong></p>
      </div>
    `,
    text: 'Bienvenue sur OsteoUpgrade ! Accédez aux consultations V3, à la bibliothèque de tests et aux rappels automatisés.'
  },
  {
    id: 'seminar',
    name: 'Relance séminaire',
    subject: 'Votre place pour notre prochain séminaire',
    description: 'Relance ciblée pour confirmer la présence à un événement.',
    html: `
      <div style="font-family: Inter, sans-serif; color: #0f172a;">
        <p>Bonjour 👋</p>
        <p>Nous gardons votre place pour le prochain séminaire OsteoUpgrade. Confirmez votre présence en un clic.</p>
        <p style="margin: 12px 0;">
          <a href="https://osteoupgrade.app" style="background:#22c55e; color:white; padding:10px 16px; border-radius:8px; text-decoration:none;">Confirmer ma venue</a>
        </p>
        <p>Besoin d’informations ? Répondez directement à cet email.</p>
      </div>
    `,
    text: 'Nous gardons votre place pour le prochain séminaire OsteoUpgrade. Confirmez votre présence en un clic.'
  },
  {
    id: 'reactivation',
    name: 'Réactivation inactifs',
    subject: 'Rejoignez-nous à nouveau sur OsteoUpgrade',
    description: 'Séquence courte pour réengager les comptes dormants.',
    html: `
      <div style="font-family: Inter, sans-serif; color: #0f172a;">
        <p>Bonjour 👋</p>
        <p>Nous avons ajouté de nouvelles ressources depuis votre dernière connexion :
        consultations V3, nouvelles fiches tests et rappels automatisés.</p>
        <p>Connectez-vous pour les découvrir et récupérer votre progression.</p>
        <p style="color:#6b7280; font-size:12px;">Si vous ne souhaitez plus recevoir ces emails, répondez STOP.</p>
      </div>
    `,
    text: 'Nouvelles ressources disponibles sur OsteoUpgrade : consultations V3, fiches tests et rappels automatisés.'
  }
]

export default function MailingAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [toInput, setToInput] = useState('')
  const [fromInput, setFromInput] = useState<string>(process.env.NEXT_PUBLIC_RESEND_FROM || '')
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates)
  const [subject, setSubject] = useState(defaultTemplates[0].subject)
  const [html, setHtml] = useState(defaultTemplates[0].html)
  const [text, setText] = useState(defaultTemplates[0].text || '')
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplates[0].id)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [audienceMode, setAudienceMode] = useState<'manual' | 'all' | 'subscription'>('manual')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('premium_silver')
  const [members, setMembers] = useState<{ email: string; role: string; subscription_status: string | null }[]>([])
  const [automationDraft, setAutomationDraft] = useState<Omit<Automation, 'id' | 'active'>>({
    name: '',
    trigger: '',
    audience: '',
    schedule: ''
  })
  const [automations, setAutomations] = useState<Automation[]>([])
  const [templateDraft, setTemplateDraft] = useState<Template>({
    id: '',
    name: '',
    subject: '',
    description: '',
    html: '',
    text: ''
  })
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

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

        const { data: membersData } = await supabase
          .from('profiles')
          .select('email, role, subscription_status')
          .not('email', 'is', null)

        if (membersData) {
          setMembers(membersData.filter((member) => !!member.email) as typeof members)
        }
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  const applyTemplate = (templateId: string) => {
    const template = templates.find((tpl) => tpl.id === templateId)
    if (!template) return
    setSelectedTemplate(template.id)
    setSubject(template.subject)
    setHtml(template.html)
    setText(template.text || '')
  }

  const selectedRecipients = useMemo(() => {
    if (audienceMode === 'all') {
      return Array.from(new Set(members.map((member) => member.email)))
    }

    if (audienceMode === 'subscription') {
      const filtered = members.filter((member) => {
        if (subscriptionFilter === 'admin') {
          return member.role === 'admin'
        }
        if (subscriptionFilter === 'free') {
          return member.role === 'free'
        }

        return member.subscription_status === subscriptionFilter
      })

      return Array.from(new Set(filtered.map((member) => member.email)))
    }

    return toInput
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)
  }, [audienceMode, members, subscriptionFilter, toInput])

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html
    }
  }, [html])

  const applyFormatting = (command: string, value?: string) => {
    if (!editorRef.current) return
    document.execCommand(command, false, value)
    setHtml(editorRef.current.innerHTML)
    setText(editorRef.current.innerText)
  }

  const handleImageInsert = () => {
    const url = window.prompt('URL de l’image à insérer dans le mail')
    if (url) {
      applyFormatting('insertImage', url)
    }
  }

  const handleEditorInput = (event: React.FormEvent<HTMLDivElement>) => {
    const content = event.currentTarget.innerHTML
    setHtml(content)
    setText(event.currentTarget.innerText)
  }

  const resetTemplateDraft = () => {
    setTemplateDraft({ id: '', name: '', subject: '', description: '', html: '', text: '' })
    setEditingTemplateId(null)
  }

  const startTemplateEdit = (template: Template) => {
    setEditingTemplateId(template.id)
    setTemplateDraft(template)
  }

  const saveTemplate = () => {
    if (!templateDraft.name || !templateDraft.subject || !templateDraft.html) {
      setResult({ type: 'error', message: 'Complétez au moins le nom, le sujet et le contenu HTML du template.' })
      return
    }

    if (editingTemplateId) {
      setTemplates((prev) => prev.map((tpl) => (tpl.id === editingTemplateId ? { ...templateDraft, id: editingTemplateId } : tpl)))
    } else {
      const newTemplate = { ...templateDraft, id: `custom-${Date.now()}` }
      setTemplates((prev) => [...prev, newTemplate])
    }

    resetTemplateDraft()
  }

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== templateId))

    if (selectedTemplate === templateId) {
      const fallback = templates.find((tpl) => tpl.id !== templateId) || defaultTemplates[0]
      setSelectedTemplate(fallback.id)
      setSubject(fallback.subject)
      setHtml(fallback.html)
      setText(fallback.text || '')
    }
  }

  const handleAutomationSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!automationDraft.name) return

    const newAutomation: Automation = {
      id: `automation-${Date.now()}`,
      active: true,
      ...automationDraft
    }

    setAutomations((prev) => [...prev, newAutomation])
    setAutomationDraft({ name: '', trigger: '', audience: '', schedule: '' })
  }

  const toggleAutomation = (automationId: string) => {
    setAutomations((prev) => prev.map((automation) => (automation.id === automationId ? { ...automation, active: !automation.active } : automation)))
  }

  const deleteAutomation = (automationId: string) => {
    setAutomations((prev) => prev.filter((automation) => automation.id !== automationId))
  }

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()
    setResult(null)

    const recipients = selectedRecipients

    if (!recipients.length) {
      setResult({ type: 'error', message: 'Ajoutez au moins un destinataire (manuel, tous les membres ou abonnement ciblé).' })
      return
    }

    if (!fromInput.trim()) {
      setResult({ type: 'error', message: 'Renseignez un expéditeur (RESEND_FROM) correspondant à votre domaine validé.' })
      return
    }

    if (!subject || !html) {
      setResult({ type: 'error', message: 'Le sujet et le contenu HTML sont obligatoires.' })
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/mailing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipients, subject, html, text, from: fromInput, tags: ['admin-send'] })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Impossible d\'envoyer l\'email.')
      }

      setResult({ type: 'success', message: 'Email envoyé via Resend. Vérifiez votre boîte de réception.' })
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || 'Erreur lors de l\'envoi.' })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Mail className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Mailing & Newsletter</h1>
              </div>
              <p className="text-purple-100 max-w-3xl">
                Envoyez vos newsletters, relances et séquences de manière fiable via Resend avec une sélection précise des destinataires et un éditeur enrichi.
              </p>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-2">
              <Shield className="h-5 w-5" />
              <span className="text-sm font-semibold">Sécurisé via API Resend</span>
            </div>
          </div>
        </div>

        {result && (
          <div
            className={`border rounded-lg p-4 flex items-center space-x-3 ${
              result.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {result.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            <p className="text-sm font-medium">{result.message}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleSend} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Expéditeur</p>
                  <p className="font-semibold">{process.env.NEXT_PUBLIC_APP_NAME || 'OsteoUpgrade'} (RESEND_FROM)</p>
                  <p className="text-xs text-gray-500">Utilisez un domaine validé dans Resend (ex: no-reply@osteo-upgrade.fr).</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Resend activé</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Adresse expéditeur</label>
                <input
                  type="text"
                  value={fromInput}
                  onChange={(e) => setFromInput(e.target.value)}
                  placeholder="ex: OsteoUpgrade <no-reply@osteo-upgrade.fr>"
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Destinataires</label>
                  <p className="text-xs text-gray-500">{selectedRecipients.length} contact(s) sélectionné(s)</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAudienceMode('manual')}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-left ${audienceMode === 'manual' ? 'border-purple-500 bg-purple-50 text-purple-900' : 'border-gray-200'}`}
                  >
                    Saisie manuelle
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceMode('all')}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-left ${audienceMode === 'all' ? 'border-purple-500 bg-purple-50 text-purple-900' : 'border-gray-200'}`}
                  >
                    Tous les membres
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudienceMode('subscription')}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-left ${audienceMode === 'subscription' ? 'border-purple-500 bg-purple-50 text-purple-900' : 'border-gray-200'}`}
                  >
                    Par abonnement
                  </button>
                </div>

                {audienceMode === 'manual' && (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={toInput}
                      onChange={(e) => setToInput(e.target.value)}
                      placeholder="ex: contact@domaine.com, demo@osteoupgrade.app"
                      className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="text-xs text-gray-500">Séparez les emails par des virgules.</p>
                  </div>
                )}

                {audienceMode === 'all' && (
                  <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-900">
                    {members.length ? `${members.length} membres sélectionnés automatiquement.` : 'Chargement des membres...'}
                  </div>
                )}

                {audienceMode === 'subscription' && (
                  <div className="space-y-2">
                    <select
                      value={subscriptionFilter}
                      onChange={(e) => setSubscriptionFilter(e.target.value)}
                      className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="premium_silver">Premium Silver</option>
                      <option value="premium_gold">Premium Gold</option>
                      <option value="free">Membres gratuits</option>
                      <option value="admin">Admins</option>
                    </select>
                    <p className="text-xs text-gray-500">Envoi ciblé par type d’abonnement (subscription_status) ou rôle.</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Sujet</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Rédaction visuelle</label>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ImageIcon className="h-4 w-4" />
                      <span>Ajoutez images, listes, mise en forme</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200">
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      <select
                        onChange={(e) => applyFormatting('fontName', e.target.value)}
                        className="rounded border-gray-300 text-xs"
                        defaultValue="Inter"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Arial">Arial</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                      <select
                        onChange={(e) => applyFormatting('fontSize', e.target.value)}
                        className="rounded border-gray-300 text-xs"
                        defaultValue="3"
                      >
                        <option value="2">Petit</option>
                        <option value="3">Normal</option>
                        <option value="4">Grand</option>
                        <option value="5">Très grand</option>
                      </select>
                      <button type="button" onClick={() => applyFormatting('bold')} className="rounded px-2 py-1 hover:bg-gray-100 font-semibold">
                        Gras
                      </button>
                      <button type="button" onClick={() => applyFormatting('italic')} className="rounded px-2 py-1 hover:bg-gray-100 italic">
                        Italique
                      </button>
                      <button type="button" onClick={() => applyFormatting('underline')} className="rounded px-2 py-1 hover:bg-gray-100">
                        Souligné
                      </button>
                      <button type="button" onClick={() => applyFormatting('insertUnorderedList')} className="rounded px-2 py-1 hover:bg-gray-100">
                        Liste
                      </button>
                      <button type="button" onClick={() => applyFormatting('insertOrderedList')} className="rounded px-2 py-1 hover:bg-gray-100">
                        Liste numérotée
                      </button>
                      <button
                        type="button"
                        onClick={handleImageInsert}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-gray-100"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Image
                      </button>
                    </div>
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[250px] w-full p-4 focus:outline-none"
                      onInput={handleEditorInput}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Le HTML est généré automatiquement. Utilisez les outils ci-dessus pour styliser votre message.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Version texte (optionnel)</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-[250px] rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                    <p className="font-medium text-gray-800">Aperçu HTML</p>
                    <div className="border rounded-lg p-3 bg-white max-h-48 overflow-auto" dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Wand2 className="h-4 w-4 text-purple-500" />
                  <span>{templates.length} templates prêts à être appliqués</span>
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>{sending ? 'Envoi en cours...' : 'Envoyer via Resend'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Templates</h3>
              </div>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`w-full text-left border rounded-lg p-3 transition ${
                      selectedTemplate === template.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-sm text-gray-500">{template.subject}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => applyTemplate(template.id)}
                          className="inline-flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-2 py-1 text-xs text-purple-700"
                        >
                          <Wand2 className="h-4 w-4" />
                          Appliquer
                        </button>
                        <button
                          type="button"
                          onClick={() => startTemplateEdit(template)}
                          className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTemplate(template.id)}
                          className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{template.description}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FilePlus2 className="h-4 w-4 text-purple-600" />
                  {editingTemplateId ? 'Modifier un template' : 'Créer un template'}
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={templateDraft.name}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, name: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Sujet"
                    value={templateDraft.subject}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, subject: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={templateDraft.description}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, description: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <textarea
                    placeholder="Contenu HTML"
                    value={templateDraft.html}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, html: e.target.value })}
                    className="w-full h-24 rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <textarea
                    placeholder="Texte brut (optionnel)"
                    value={templateDraft.text}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, text: e.target.value })}
                    className="w-full h-20 rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={saveTemplate}
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                    >
                      <Wand2 className="h-4 w-4" />
                      {editingTemplateId ? 'Mettre à jour' : 'Ajouter'}
                    </button>
                    {editingTemplateId && (
                      <button
                        type="button"
                        onClick={resetTemplateDraft}
                        className="text-xs text-gray-500 underline"
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <PlayCircle className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Automatisations</h3>
              </div>
              <p className="text-sm text-gray-600">Planifiez des envois automatiques (rappels, bienvenue, relances) avec déclencheurs et audience personnalisés.</p>
              <form className="space-y-2" onSubmit={handleAutomationSubmit}>
                <input
                  type="text"
                  placeholder="Nom de l'automatisation"
                  value={automationDraft.name}
                  onChange={(e) => setAutomationDraft({ ...automationDraft, name: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Déclencheur (ex: nouvelle inscription)"
                  value={automationDraft.trigger}
                  onChange={(e) => setAutomationDraft({ ...automationDraft, trigger: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Audience (ex: premium, free, tous)"
                  value={automationDraft.audience}
                  onChange={(e) => setAutomationDraft({ ...automationDraft, audience: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Calendrier (ex: J+3, chaque lundi, date précise)"
                  value={automationDraft.schedule}
                  onChange={(e) => setAutomationDraft({ ...automationDraft, schedule: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                >
                  <Rocket className="h-4 w-4" />
                  Programmer
                </button>
              </form>
              <div className="space-y-2">
                {automations.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune automatisation pour le moment.</p>
                )}
                {automations.map((automation) => (
                  <div key={automation.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">{automation.name}</p>
                        <p className="text-xs text-gray-500">Déclencheur: {automation.trigger || 'Non défini'} · Audience: {automation.audience || 'Tous'} · Planification: {automation.schedule || 'Manuelle'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                            automation.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Flame className="h-4 w-4" />
                          {automation.active ? 'Activé' : 'En pause'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleAutomation(automation.id)}
                          className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          {automation.active ? 'Mettre en pause' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAutomation(automation.id)}
                          className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
