'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Send,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  PlayCircle,
  Pause,
  Clock,
  Users,
  Sparkles,
  ChevronDown,
  FileText,
  Bold,
  Italic,
  Link2,
  Image as ImageIcon,
  List,
  Heading2,
  Paperclip
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

type Attachment = {
  name: string
  content: string
  type: string
  cid?: string
  disposition?: 'inline' | 'attachment'
}

type AutomationStep = {
  id: string
  templateId: string
  delayDays: number
}

type Automation = {
  id: string
  name: string
  trigger: string
  audience: string
  schedule: string
  steps: AutomationStep[]
  active: boolean
}

const automationTriggerPresets = [
  { label: 'Nouvelle inscription', value: 'Nouvelle inscription' },
  { label: 'Passage à Premium', value: 'Passage à Premium' },
  { label: 'Abonnement expiré', value: 'Abonnement expiré' },
  { label: 'Inactif depuis 30 jours', value: 'Inactif depuis 30 jours' },
  { label: 'Sur free depuis 14 jours', value: 'Sur free depuis 14 jours' },
  { label: 'Inscription à un séminaire', value: 'Inscription à un séminaire' },
  { label: 'Désinscription d\'un séminaire', value: 'Désinscription d\'un séminaire' }
]

export default function MailingAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)

  // Newsletter state
  const [toInput, setToInput] = useState('')
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('<p>Rédigez votre newsletter ici...</p>')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [audienceMode, setAudienceMode] = useState<'manual' | 'all' | 'subscription'>('manual')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('premium_silver')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([])
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [templateDraft, setTemplateDraft] = useState<Template>({
    id: '',
    name: '',
    subject: '',
    description: '',
    html: '',
    text: ''
  })
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [templateSaving, setTemplateSaving] = useState(false)

  // Automations state
  const [automations, setAutomations] = useState<Automation[]>([])
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [automationDraft, setAutomationDraft] = useState<Omit<Automation, 'id' | 'active'>>({
    name: '',
    trigger: automationTriggerPresets[0]?.value || '',
    audience: 'Tous les membres',
    schedule: 'Démarrage immédiat',
    steps: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      await Promise.all([loadTemplates(), loadAutomations()])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('mail_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadAutomations = async () => {
    try {
      const { data: automationData, error: automationError } = await supabase
        .from('mail_automations')
        .select('*')
        .order('created_at', { ascending: false })

      if (automationError) throw automationError

      const automationsWithSteps = await Promise.all(
        (automationData || []).map(async (auto) => {
          const { data: stepsData } = await supabase
            .from('mail_automation_steps')
            .select('*')
            .eq('automation_id', auto.id)
            .order('step_order', { ascending: true })

          return {
            id: auto.id,
            name: auto.name,
            trigger: auto.trigger_event,
            audience: 'Tous les membres',
            schedule: 'Démarrage immédiat',
            steps: (stepsData || []).map((step: any) => ({
              id: step.id,
              templateId: step.template_slug || '',
              delayDays: Math.floor(step.wait_minutes / (24 * 60))
            })),
            active: auto.active
          }
        })
      )

      setAutomations(automationsWithSteps)
    } catch (error) {
      console.error('Error loading automations:', error)
    }
  }

  // HTML formatting functions
  const insertHtml = (tag: string, promptText?: string) => {
    const editor = editorRef.current
    if (!editor) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    let htmlToInsert = ''

    if (tag === 'link') {
      const url = prompt(promptText || 'Entrez l\'URL :')
      if (!url) return
      const selectedText = range.toString() || 'Lien'
      htmlToInsert = `<a href="${url}" style="color:#7c3aed;text-decoration:underline;">${selectedText}</a>`
    } else if (tag === 'h2') {
      const selectedText = range.toString() || 'Titre'
      htmlToInsert = `<h2 style="color:#7c3aed;font-size:24px;font-weight:bold;margin:16px 0 8px 0;">${selectedText}</h2>`
    } else if (tag === 'ul') {
      htmlToInsert = '<ul style="margin:12px 0;padding-left:24px;"><li>Élément de liste</li></ul>'
    } else if (tag === 'br') {
      htmlToInsert = '<br />'
    } else {
      const selectedText = range.toString() || 'Texte'
      htmlToInsert = `<${tag}>${selectedText}</${tag}>`
    }

    range.deleteContents()
    const fragment = range.createContextualFragment(htmlToInsert)
    range.insertNode(fragment)

    setHtml(editor.innerHTML)
    editor.focus()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      const cid = `image-${Date.now()}`

      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          content: base64.split(',')[1],
          type: file.type,
          cid,
          disposition: 'inline'
        }
      ])

      const imgHtml = `<img src="cid:${cid}" alt="${file.name}" style="display:block;max-width:640px;width:100%;height:auto;margin:12px 0;" />`

      if (editorRef.current) {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          range.deleteContents()
          const fragment = range.createContextualFragment(imgHtml)
          range.insertNode(fragment)
        } else {
          editorRef.current.innerHTML += imgHtml
        }
        setHtml(editorRef.current.innerHTML)
      }
    }
    reader.readAsDataURL(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          content: base64.split(',')[1],
          type: file.type || 'application/octet-stream',
          disposition: 'attachment'
        }
      ])
      alert(`Pièce jointe "${file.name}" ajoutée`)
    }
    reader.readAsDataURL(file)

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSubject(template.subject)
      setHtml(template.html)
      if (editorRef.current) {
        editorRef.current.innerHTML = template.html
      }
    }
  }

  // Save template
  const handleSaveTemplate = async () => {
    if (!templateDraft.name || !templateDraft.subject) {
      alert('Le nom et le sujet sont requis')
      return
    }

    setTemplateSaving(true)
    try {
      const templateData = {
        name: templateDraft.name,
        subject: templateDraft.subject,
        description: templateDraft.description,
        html: templateDraft.html,
        text: templateDraft.text || ''
      }

      if (editingTemplateId) {
        // Update existing
        const { error } = await supabase
          .from('mail_templates')
          .update(templateData)
          .eq('id', editingTemplateId)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('mail_templates')
          .insert(templateData)

        if (error) throw error
      }

      await loadTemplates()
      setTemplateModalOpen(false)
      setEditingTemplateId(null)
      setTemplateDraft({ id: '', name: '', subject: '', description: '', html: '', text: '' })
      setResult({ type: 'success', message: 'Template sauvegardé !' })
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setTemplateSaving(false)
    }
  }

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) return

    try {
      const { error } = await supabase
        .from('mail_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      await loadTemplates()
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('')
        setSubject('')
        setHtml('<p>Rédigez votre newsletter ici...</p>')
      }
      setResult({ type: 'success', message: 'Template supprimé' })
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    }
  }

  // Send newsletter
  const handleSend = async () => {
    if (!subject || !html) {
      setResult({ type: 'error', message: 'Le sujet et le contenu sont requis' })
      return
    }

    const recipients: string[] = []
    if (audienceMode === 'manual') {
      const emails = toInput.split(/[,;\n]/).map(e => e.trim()).filter(e => e)
      if (emails.length === 0) {
        setResult({ type: 'error', message: 'Ajoutez au moins un destinataire' })
        return
      }
      recipients.push(...emails)
    }

    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/mailing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject,
          html: editorRef.current?.innerHTML || html,
          audienceMode,
          subscriptionFilter: audienceMode === 'subscription' ? subscriptionFilter : undefined,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setResult({ type: 'success', message: `Email envoyé à ${data.sent} destinataire(s) !` })
      setToInput('')
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setSending(false)
    }
  }

  // Automation management
  const addAutomationStep = () => {
    const lastDelay = automationDraft.steps.length > 0
      ? automationDraft.steps[automationDraft.steps.length - 1].delayDays
      : 0

    setAutomationDraft((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: `step-${Date.now()}`,
          templateId: templates[0]?.id || '',
          delayDays: lastDelay + 2
        }
      ]
    }))
  }

  const updateAutomationStep = (stepId: string, updates: Partial<AutomationStep>) => {
    setAutomationDraft((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step))
    }))
  }

  const removeAutomationStep = (stepId: string) => {
    setAutomationDraft((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== stepId)
    }))
  }

  const handleAutomationSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!automationDraft.name || !automationDraft.trigger || automationDraft.steps.length === 0) {
      setResult({ type: 'error', message: 'Complétez tous les champs requis' })
      return
    }

    try {
      const steps = automationDraft.steps.map((step, index) => ({
        step_order: index,
        wait_minutes: step.delayDays * 24 * 60,
        subject: templates.find(t => t.id === step.templateId)?.subject || 'Email automatique',
        template_slug: step.templateId,
        payload: {}
      }))

      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: automationDraft.name,
          description: `Déclencheur: ${automationDraft.trigger}`,
          trigger_event: automationDraft.trigger,
          steps
        })
      })

      if (!response.ok) throw new Error('Impossible de créer l\'automatisation')

      const { automation } = await response.json()

      const newAutomation: Automation = {
        id: automation.id,
        name: automation.name,
        trigger: automation.trigger_event,
        audience: automationDraft.audience,
        schedule: automationDraft.schedule,
        steps: automationDraft.steps,
        active: automation.active
      }

      setAutomations((prev) => [...prev, newAutomation])
      setResult({ type: 'success', message: 'Automatisation créée !' })
      setAutomationModalOpen(false)
      setAutomationDraft({
        name: '',
        trigger: automationTriggerPresets[0]?.value || '',
        audience: 'Tous les membres',
        schedule: 'Démarrage immédiat',
        steps: []
      })
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || 'Erreur' })
    }
  }

  const toggleAutomation = async (automationId: string) => {
    const automation = automations.find(a => a.id === automationId)
    if (!automation) return

    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !automation.active })
      })

      if (!response.ok) throw new Error('Impossible de mettre à jour')

      setAutomations((prev) => prev.map((auto) => (auto.id === automationId ? { ...auto, active: !auto.active } : auto)))
      setResult({ type: 'success', message: `Automatisation ${!automation.active ? 'activée' : 'désactivée'}` })
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || 'Erreur' })
    }
  }

  const deleteAutomation = async (automationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) return

    try {
      const response = await fetch(`/api/automations/${automationId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Impossible de supprimer')

      setAutomations((prev) => prev.filter((automation) => automation.id !== automationId))
      setResult({ type: 'success', message: 'Automatisation supprimée' })
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || 'Erreur' })
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mailing</h1>
            <p className="text-gray-600 mt-1">Envoyez des newsletters et créez des automatisations</p>
          </div>
          <Mail className="h-12 w-12 text-purple-600" />
        </div>

        {/* Result notification */}
        {result && (
          <div className={`p-4 rounded-lg ${result.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <span>{result.message}</span>
              <button onClick={() => setResult(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Newsletter Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Send className="h-6 w-6 text-purple-600" />
              Rédiger une newsletter
            </h2>
          </div>

          <div className="space-y-6">
            {/* Template selector and management */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <div className="relative">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-10 appearance-none"
                  >
                    <option value="">Aucun template (rédaction libre)</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-2 pt-7">
                <button
                  onClick={() => {
                    setTemplateModalOpen(true)
                    setEditingTemplateId(null)
                    setTemplateDraft({ id: '', name: '', subject: '', description: '', html: '<p>Contenu du template...</p>', text: '' })
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau
                </button>

                {selectedTemplateId && (
                  <>
                    <button
                      onClick={() => {
                        const template = templates.find(t => t.id === selectedTemplateId)
                        if (template) {
                          setTemplateModalOpen(true)
                          setEditingTemplateId(template.id)
                          setTemplateDraft(template)
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(selectedTemplateId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de l'email..."
                className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires</label>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setAudienceMode('manual')}
                  className={`px-4 py-2 rounded-lg border transition ${audienceMode === 'manual' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Manuel
                </button>
                <button
                  onClick={() => setAudienceMode('all')}
                  className={`px-4 py-2 rounded-lg border transition ${audienceMode === 'all' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Tous les membres
                </button>
                <button
                  onClick={() => setAudienceMode('subscription')}
                  className={`px-4 py-2 rounded-lg border transition ${audienceMode === 'subscription' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Par abonnement
                </button>
              </div>

              {audienceMode === 'manual' && (
                <textarea
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="Entrez les emails (séparés par des virgules ou retours à la ligne)&#10;exemple@email.com, autre@email.com"
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              )}

              {audienceMode === 'subscription' && (
                <select
                  value={subscriptionFilter}
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="premium_silver">Premium Silver</option>
                  <option value="premium_gold">Premium Gold</option>
                  <option value="free">Gratuit</option>
                </select>
              )}
            </div>

            {/* HTML Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contenu HTML</label>

              {/* Formatting toolbar */}
              <div className="mb-2 space-y-2">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex-wrap">
                  <span className="text-xs font-semibold text-gray-600 mr-2">Mise en forme :</span>
                  <button
                    type="button"
                    onClick={() => insertHtml('strong')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                    title="Gras"
                  >
                    <Bold className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-700">Gras</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtml('em')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                    title="Italique"
                  >
                    <Italic className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-700">Italique</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtml('h2')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                    title="Titre"
                  >
                    <Heading2 className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-700">Titre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtml('link')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                    title="Lien"
                  >
                    <Link2 className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-700">Lien</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertHtml('ul')}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                    title="Liste"
                  >
                    <List className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-700">Liste</span>
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                    title="Insérer une image"
                  >
                    <ImageIcon className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-700">Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                    title="Ajouter une pièce jointe"
                  >
                    <Paperclip className="h-4 w-4 text-gray-700" />
                    <span className="text-sm text-gray-700">Pièce jointe</span>
                  </button>
                </div>

                {/* Variable selector */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-900 mb-2">📝 Variables disponibles (cliquez pour insérer) :</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { var: '{{nom}}', desc: 'Nom du plan (Premium Silver/Gold)' },
                          { var: '{{prix}}', desc: 'Prix mensuel (29,99€ / 49,99€)' },
                          { var: '{{date_fact}}', desc: 'Date de prochaine facturation' },
                          { var: '{{date_renouv}}', desc: 'Date de renouvellement' },
                          { var: '{{cycle}}', desc: 'Numéro du cycle' },
                          { var: '{{jours}}', desc: 'Jours avant renouvellement' },
                          { var: '{{full_name}}', desc: 'Nom complet' },
                          { var: '{{email}}', desc: 'Email de l\'utilisateur' }
                        ].map((variable) => (
                          <button
                            key={variable.var}
                            type="button"
                            onClick={() => {
                              if (editorRef.current) {
                                const selection = window.getSelection()
                                if (selection && selection.rangeCount > 0) {
                                  const range = selection.getRangeAt(0)
                                  range.deleteContents()
                                  const textNode = document.createTextNode(variable.var)
                                  range.insertNode(textNode)
                                } else {
                                  editorRef.current.innerHTML += variable.var
                                }
                                setHtml(editorRef.current.innerHTML)
                              }
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-blue-100 rounded-md transition border border-blue-300 text-sm font-mono text-blue-900 hover:border-blue-400"
                            title={variable.desc}
                          >
                            {variable.var}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-blue-700 mt-2">💡 Cliquez sur une variable pour l'insérer dans votre email</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                ref={attachmentInputRef}
                type="file"
                onChange={handleAttachmentUpload}
                className="hidden"
              />

              {/* Attachments list */}
              {attachments.length > 0 && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">Pièces jointes ({attachments.length})</p>
                  <div className="space-y-1">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white rounded px-3 py-2">
                        <span className="flex items-center gap-2 text-gray-700">
                          {attachment.disposition === 'inline' ? (
                            <ImageIcon className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Paperclip className="h-4 w-4 text-gray-600" />
                          )}
                          {attachment.name}
                          {attachment.disposition === 'inline' && (
                            <span className="text-xs text-blue-600">(inline)</span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                ref={editorRef}
                contentEditable
                onInput={(e) => setHtml(e.currentTarget.innerHTML)}
                className="w-full min-h-[400px] p-6 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none bg-white"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Astuce : Vous pouvez directement modifier le HTML ci-dessus ou utiliser les boutons de formatage
              </p>
            </div>

            {/* Send button */}
            <div className="flex justify-end">
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg font-semibold"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Envoyer la newsletter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Automations Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Automatisations
              </h2>
              <p className="text-gray-600 mt-1">Programmez des séquences d'emails automatiques</p>
            </div>
            <button
              onClick={() => setAutomationModalOpen(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle automatisation
            </button>
          </div>

          {automations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Aucune automatisation créée</p>
              <p className="text-sm text-gray-500 mt-1">Cliquez sur "Nouvelle automatisation" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {automations.map((automation) => (
                <div key={automation.id} className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${automation.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {automation.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" />
                          Déclencheur: {automation.trigger}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {automation.audience}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {automation.steps.length} email(s)
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleAutomation(automation.id)}
                        className={`px-4 py-2 rounded-lg transition ${automation.active ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                        {automation.active ? <Pause className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteAutomation(automation.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Steps preview */}
                  {automation.steps.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 border-purple-200 space-y-2">
                      {automation.steps.map((step, index) => {
                        const template = templates.find(t => t.id === step.templateId)
                        return (
                          <div key={step.id} className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span>
                              {step.delayDays === 0 ? 'Immédiat' : `J+${step.delayDays}`} - {template?.name || 'Template inconnu'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Modal */}
        {templateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingTemplateId ? 'Modifier le template' : 'Nouveau template'}
                </h3>
                <button
                  onClick={() => {
                    setTemplateModalOpen(false)
                    setEditingTemplateId(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du template</label>
                  <input
                    type="text"
                    value={templateDraft.name}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, name: e.target.value })}
                    placeholder="Ex: Bienvenue Premium"
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                  <input
                    type="text"
                    value={templateDraft.subject}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, subject: e.target.value })}
                    placeholder="Ex: Bienvenue sur OsteoUpgrade 🎉"
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={templateDraft.description}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, description: e.target.value })}
                    placeholder="Courte description du template"
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contenu HTML</label>

                  {/* Formatting toolbar for template */}
                  <div className="mb-2 space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 flex-wrap">
                      <span className="text-xs font-semibold text-gray-600 mr-2">Mise en forme :</span>
                      <button
                        type="button"
                        onClick={() => {
                          const boldText = prompt('Texte en gras :') || 'Texte'
                          setTemplateDraft({ ...templateDraft, html: templateDraft.html + `<strong>${boldText}</strong>` })
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                        title="Gras"
                      >
                        <Bold className="h-4 w-4 text-gray-700" />
                        <span className="text-sm text-gray-700">Gras</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const italicText = prompt('Texte en italique :') || 'Texte'
                          setTemplateDraft({ ...templateDraft, html: templateDraft.html + `<em>${italicText}</em>` })
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                        title="Italique"
                      >
                        <Italic className="h-4 w-4 text-gray-700" />
                        <span className="text-sm text-gray-700">Italique</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const headingText = prompt('Texte du titre :') || 'Titre'
                          setTemplateDraft({ ...templateDraft, html: templateDraft.html + `<h2 style="color:#7c3aed;font-size:24px;font-weight:bold;margin:16px 0 8px 0;">${headingText}</h2>` })
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                        title="Titre"
                      >
                        <Heading2 className="h-4 w-4 text-gray-700" />
                        <span className="text-sm text-gray-700">Titre</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const linkText = prompt('Texte du lien :') || 'Lien'
                          const linkUrl = prompt('URL :') || '#'
                          setTemplateDraft({ ...templateDraft, html: templateDraft.html + `<a href="${linkUrl}" style="color:#7c3aed;text-decoration:underline;">${linkText}</a>` })
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                        title="Lien"
                      >
                        <Link2 className="h-4 w-4 text-gray-700" />
                        <span className="text-sm text-gray-700">Lien</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateDraft({ ...templateDraft, html: templateDraft.html + `<ul style="margin:12px 0;padding-left:24px;"><li>Élément 1</li><li>Élément 2</li></ul>` })
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                        title="Liste"
                      >
                        <List className="h-4 w-4 text-gray-700" />
                        <span className="text-sm text-gray-700">Liste</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const text = prompt('Texte du paragraphe :') || 'Votre texte ici...'
                          setTemplateDraft({ ...templateDraft, html: templateDraft.html + `<p style="margin:0 0 16px;line-height:1.6;color:#374151;">${text}</p>` })
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-gray-100 rounded-md transition border border-gray-300 flex items-center gap-1.5"
                        title="Paragraphe"
                      >
                        <FileText className="h-4 w-4 text-gray-700" />
                        <span className="text-sm text-gray-700">Paragraphe</span>
                      </button>
                    </div>

                    {/* Variable selector */}
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-900 mb-2">📝 Variables disponibles (cliquez pour insérer) :</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { var: '{{nom}}', desc: 'Nom du plan (Premium Silver/Gold)' },
                              { var: '{{prix}}', desc: 'Prix mensuel (29,99€ / 49,99€)' },
                              { var: '{{date_fact}}', desc: 'Date de prochaine facturation' },
                              { var: '{{date_renouv}}', desc: 'Date de renouvellement' },
                              { var: '{{cycle}}', desc: 'Numéro du cycle' },
                              { var: '{{jours}}', desc: 'Jours avant renouvellement' },
                              { var: '{{full_name}}', desc: 'Nom complet' },
                              { var: '{{email}}', desc: 'Email de l\'utilisateur' }
                            ].map((variable) => (
                              <button
                                key={variable.var}
                                type="button"
                                onClick={() => {
                                  setTemplateDraft({ ...templateDraft, html: templateDraft.html + variable.var })
                                }}
                                className="px-3 py-1.5 bg-white hover:bg-blue-100 rounded-md transition border border-blue-300 text-sm font-mono text-blue-900 hover:border-blue-400"
                                title={variable.desc}
                              >
                                {variable.var}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-blue-700 mt-2">💡 Cliquez sur une variable pour l'insérer dans votre template</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={templateDraft.html}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, html: e.target.value })}
                    rows={12}
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                    placeholder="<div>Votre HTML ici...</div>"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Utilisez les boutons ci-dessus pour ajouter du formatage et des variables, ou éditez le HTML directement
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setTemplateModalOpen(false)
                      setEditingTemplateId(null)
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    disabled={templateSaving}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {templateSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Sauvegarder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Automation Modal */}
        {automationModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Programmer une automatisation</h3>
                <button
                  onClick={() => {
                    setAutomationModalOpen(false)
                    setAutomationDraft({
                      name: '',
                      trigger: automationTriggerPresets[0]?.value || '',
                      audience: 'Tous les membres',
                      schedule: 'Démarrage immédiat',
                      steps: []
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form className="p-6 space-y-6" onSubmit={handleAutomationSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'automatisation</label>
                    <input
                      type="text"
                      value={automationDraft.name}
                      onChange={(e) => setAutomationDraft({ ...automationDraft, name: e.target.value })}
                      placeholder="Ex: Bienvenue nouveau membre"
                      className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Déclencheur</label>
                    <select
                      value={automationDraft.trigger}
                      onChange={(e) => setAutomationDraft({ ...automationDraft, trigger: e.target.value })}
                      className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      {automationTriggerPresets.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Séquence d'emails</label>
                    <button
                      type="button"
                      onClick={addAutomationStep}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter un email
                    </button>
                  </div>

                  {automationDraft.steps.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-600">Aucun email dans la séquence</p>
                      <p className="text-sm text-gray-500 mt-1">Cliquez sur "Ajouter un email" pour commencer</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {automationDraft.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>

                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <select
                              value={step.templateId}
                              onChange={(e) => updateAutomationStep(step.id, { templateId: e.target.value })}
                              className="rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="">Sélectionnez un template</option>
                              {templates.map((template) => (
                                <option key={template.id} value={template.id}>
                                  {template.name}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Délai:</span>
                              <input
                                type="number"
                                min="0"
                                value={step.delayDays}
                                onChange={(e) => updateAutomationStep(step.id, { delayDays: parseInt(e.target.value) || 0 })}
                                className="w-24 rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                              <span className="text-sm text-gray-600">jours</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAutomationStep(step.id)}
                            className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setAutomationModalOpen(false)
                      setAutomationDraft({
                        name: '',
                        trigger: automationTriggerPresets[0]?.value || '',
                        audience: 'Tous les membres',
                        schedule: 'Démarrage immédiat',
                        steps: []
                      })
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Créer l'automatisation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
