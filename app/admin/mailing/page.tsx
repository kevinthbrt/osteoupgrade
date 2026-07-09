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
  Clock,
  Sparkles,
  ChevronDown,
  FileText,
  Bold,
  Italic,
  Link2,
  Image as ImageIcon,
  List,
  Heading2,
  Paperclip,
  Settings2,
  Zap,
  AlertTriangle
} from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
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
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('premium')
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
  const [showHtmlMode, setShowHtmlMode] = useState(false)
  const [showMainHtmlMode, setShowMainHtmlMode] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const templateEditorRef = useRef<HTMLDivElement>(null)

  // Initialize template editor content when modal opens
  useEffect(() => {
    if (templateModalOpen && templateEditorRef.current && !showHtmlMode) {
      templateEditorRef.current.innerHTML = templateDraft.html
    }
  }, [templateModalOpen, showHtmlMode])

  // Initialize main editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = html
    }
  }, [])

  // Automations state
  const [automations, setAutomations] = useState<Automation[]>([])
  const [automationModalOpen, setAutomationModalOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [previewAutomation, setPreviewAutomation] = useState<Automation | null>(null)
  const [previewSteps, setPreviewSteps] = useState<{ subject: string; html: string; delayDays: number }[]>([])
  const [activePreviewStep, setActivePreviewStep] = useState(0)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const openAutomationPreview = async (automation: Automation) => {
    if (previewAutomation?.id === automation.id) { setPreviewAutomation(null); setPreviewSteps([]); return }
    setPreviewAutomation(automation)
    setPreviewSteps([])
    setActivePreviewStep(0)
    if (!automation.steps.length) return
    setLoadingPreview(true)
    try {
      const stepResults = await Promise.all(
        automation.steps.map(async (step) => {
          if (!step.templateId) return null
          const { data } = await supabase
            .from('mail_templates')
            .select('html, subject')
            .or(`id.eq.${step.templateId},name.eq.${step.templateId}`)
            .single()
          return data ? { subject: data.subject, html: data.html, delayDays: step.delayDays } : null
        })
      )
      setPreviewSteps(stepResults.filter(Boolean) as { subject: string; html: string; delayDays: number }[])
    } catch { setPreviewSteps([]) }
    finally { setLoadingPreview(false) }
  }

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
      // Update editor content without using dangerouslySetInnerHTML
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
          html: showMainHtmlMode ? html : (editorRef.current?.innerHTML || html),
          audienceMode,
          subscriptionFilter: audienceMode === 'subscription' ? subscriptionFilter : undefined,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      if (data.mode === 'broadcast') {
        const syncFailures = data.syncErrors?.length || 0
        const syncedMsg = syncFailures > 0
          ? `${data.synced}/${data.totalContacts} contacts synchronisés (${syncFailures} échec(s) de synchronisation — voir la console pour le détail)`
          : `${data.synced} contacts synchronisés`
        setResult({
          type: 'success',
          message: `Campagne envoyée via Resend Broadcasts à ${data.totalContacts} destinataire(s). ${syncedMsg}.`
        })
        if (syncFailures > 0) {
          console.error('Échecs de synchronisation des contacts Resend :', data.syncErrors)
        }
      } else {
        const failures = data.total - data.sent
        setResult({
          type: 'success',
          message: failures > 0
            ? `Email envoyé à ${data.sent}/${data.total} destinataire(s) — ${failures} échec(s), voir la console pour le détail.`
            : `Email envoyé à ${data.sent} destinataire(s) !`
        })
        if (failures > 0) {
          console.error('Échecs d\'envoi :', data.errors)
        }
      }
      setToInput('')
    } catch (error: any) {
      setResult({ type: 'error', message: error.message })
    } finally {
      setSending(false)
    }
  }

  // Automation management
  const toggleAutomation = async (automationId: string) => {
    const automation = automations.find(a => a.id === automationId)
    if (!automation || togglingId === automationId) return

    setTogglingId(automationId)
    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !automation.active })
      })

      if (!response.ok) throw new Error('Impossible de mettre à jour')

      setAutomations((prev) => prev.map((auto) => (auto.id === automationId ? { ...auto, active: !auto.active } : auto)))
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || 'Erreur' })
    } finally {
      setTogglingId(null)
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
      {/* Template Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-2xl ring-1 ring-inset ring-white/60 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                <input
                  type="text"
                  value={templateDraft.subject}
                  onChange={(e) => setTemplateDraft({ ...templateDraft, subject: e.target.value })}
                  placeholder="Ex: Bienvenue sur OsteoUpgrade 🎉"
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={templateDraft.description}
                  onChange={(e) => setTemplateDraft({ ...templateDraft, description: e.target.value })}
                  placeholder="Courte description du template"
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contenu HTML</label>

                {/* Formatting toolbar for template */}
                <div className="mb-2 space-y-2">
                  <div className="flex items-center gap-2 p-3 bg-white/60 backdrop-blur-sm border-b border-white/40 rounded-t-lg flex-wrap">
                    <span className="text-xs font-semibold text-gray-600 mr-2">Mise en forme :</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (templateEditorRef.current && !showHtmlMode) {
                          const selection = window.getSelection()
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0)
                            const boldText = range.toString() || 'Texte en gras'
                            range.deleteContents()
                            const fragment = range.createContextualFragment(`<strong>${boldText}</strong>`)
                            range.insertNode(fragment)
                            setTemplateDraft({ ...templateDraft, html: templateEditorRef.current.innerHTML })
                          }
                        }
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
                        if (templateEditorRef.current && !showHtmlMode) {
                          const selection = window.getSelection()
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0)
                            const italicText = range.toString() || 'Texte en italique'
                            range.deleteContents()
                            const fragment = range.createContextualFragment(`<em>${italicText}</em>`)
                            range.insertNode(fragment)
                            setTemplateDraft({ ...templateDraft, html: templateEditorRef.current.innerHTML })
                          }
                        }
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
                        if (templateEditorRef.current && !showHtmlMode) {
                          const selection = window.getSelection()
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0)
                            const headingText = range.toString() || 'Titre'
                            range.deleteContents()
                            const fragment = range.createContextualFragment(`<h2 style="color:#7c3aed;font-size:24px;font-weight:bold;margin:16px 0 8px 0;">${headingText}</h2>`)
                            range.insertNode(fragment)
                            setTemplateDraft({ ...templateDraft, html: templateEditorRef.current.innerHTML })
                          }
                        }
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
                        if (templateEditorRef.current && !showHtmlMode) {
                          const selection = window.getSelection()
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0)
                            const linkText = range.toString() || 'Lien'
                            const linkUrl = prompt('URL du lien :') || '#'
                            range.deleteContents()
                            const fragment = range.createContextualFragment(`<a href="${linkUrl}" style="color:#7c3aed;text-decoration:underline;">${linkText}</a>`)
                            range.insertNode(fragment)
                            setTemplateDraft({ ...templateDraft, html: templateEditorRef.current.innerHTML })
                          }
                        }
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
                        if (templateEditorRef.current && !showHtmlMode) {
                          const selection = window.getSelection()
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0)
                            range.deleteContents()
                            const fragment = range.createContextualFragment(`<ul style="margin:12px 0;padding-left:24px;"><li>Élément 1</li><li>Élément 2</li></ul>`)
                            range.insertNode(fragment)
                            setTemplateDraft({ ...templateDraft, html: templateEditorRef.current.innerHTML })
                          }
                        }
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
                        if (templateEditorRef.current && !showHtmlMode) {
                          const selection = window.getSelection()
                          if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0)
                            const text = range.toString() || 'Votre texte ici...'
                            range.deleteContents()
                            const fragment = range.createContextualFragment(`<p style="margin:0 0 16px;line-height:1.6;color:#374151;">${text}</p>`)
                            range.insertNode(fragment)
                            setTemplateDraft({ ...templateDraft, html: templateEditorRef.current.innerHTML })
                          }
                        }
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
                            { var: '{{nom}}', desc: 'Nom du plan (Premium)' },
                            { var: '{{prix}}', desc: 'Prix de l’abonnement (49,99€/mois)' },
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
                                if (showHtmlMode) {
                                  setTemplateDraft({ ...templateDraft, html: templateDraft.html + variable.var })
                                } else if (templateEditorRef.current) {
                                  const selection = window.getSelection()
                                  if (selection && selection.rangeCount > 0) {
                                    const range = selection.getRangeAt(0)
                                    range.deleteContents()
                                    const textNode = document.createTextNode(variable.var)
                                    range.insertNode(textNode)
                                  } else {
                                    templateEditorRef.current.innerHTML += variable.var
                                  }
                                  setTemplateDraft({ ...templateDraft, html: templateEditorRef.current.innerHTML })
                                }
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

                {/* Mode toggle */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700 font-medium">
                    {showHtmlMode ? '📝 Mode HTML' : '👁️ Mode Visuel'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!showHtmlMode && templateEditorRef.current) {
                        setTemplateDraft({ ...templateDraft, html: templateEditorRef.current.innerHTML })
                      }
                      setShowHtmlMode(!showHtmlMode)
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition text-sm font-medium"
                  >
                    {showHtmlMode ? '👁️ Passer en mode visuel' : '📝 Voir le code HTML'}
                  </button>
                </div>

                {showHtmlMode ? (
                  <textarea
                    value={templateDraft.html}
                    onChange={(e) => setTemplateDraft({ ...templateDraft, html: e.target.value })}
                    rows={12}
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none font-mono text-sm"
                    placeholder="<div>Votre HTML ici...</div>"
                  />
                ) : (
                  <div
                    ref={templateEditorRef}
                    contentEditable
                    onInput={(e) => setTemplateDraft({ ...templateDraft, html: e.currentTarget.innerHTML })}
                    className="w-full min-h-[400px] p-6 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-b-xl focus:outline-none overflow-y-auto"
                    suppressContentEditableWarning
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">
                  💡 {showHtmlMode ? 'Éditez le code HTML directement' : 'Éditez directement dans la zone ci-dessus comme dans un traitement de texte'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setTemplateModalOpen(false)
                    setEditingTemplateId(null)
                  }}
                  className="px-6 py-2 bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 rounded-xl hover:bg-white/90 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={templateSaving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all disabled:opacity-50"
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

      {/* Automations Manager Modal */}
      {automationModalOpen && (() => {
        const isSeminaire = (a: Automation) =>
          a.trigger.toLowerCase().includes('seminar') || a.trigger.toLowerCase().includes('séminaire') ||
          a.name.toLowerCase().includes('séminaire') || a.name.toLowerCase().includes('seminaire')
        const abonnementAutomations = automations.filter(a => !isSeminaire(a))
        const seminaireAutomations = automations.filter(isSeminaire)

        const AutomationRow = ({ automation, isObsolete }: { automation: Automation; isObsolete: boolean }) => {
          const isExpanded = previewAutomation?.id === automation.id
          return (
            <div className={`border-b border-slate-100 last:border-b-0 ${isObsolete ? 'opacity-60' : ''}`}>
              <div
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-purple-50/60' : ''}`}
                onClick={() => openAutomationPreview(automation)}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${isObsolete ? 'bg-slate-100' : isExpanded ? 'bg-purple-200' : 'bg-purple-100'}`}>
                  <Zap className={`h-4 w-4 ${isObsolete ? 'text-slate-400' : 'text-purple-600'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800 truncate">{automation.name}</span>
                    {isObsolete && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium flex-shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        Obsolète
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <PlayCircle className="h-3 w-3" />
                      {automation.trigger}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {automation.steps.length} étape{automation.steps.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={e => { e.stopPropagation(); if (!isObsolete) toggleAutomation(automation.id) }}
                  disabled={togglingId === automation.id || isObsolete}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    automation.active ? 'bg-emerald-500' : 'bg-slate-200'
                  } ${isObsolete ? 'cursor-not-allowed' : 'cursor-pointer'} ${togglingId === automation.id ? 'opacity-50' : ''}`}
                  title={isObsolete ? 'Automatisation obsolète' : automation.active ? 'Désactiver' : 'Activer'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${automation.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Email preview panel */}
              {isExpanded && (
                <div className="border-t border-purple-100 bg-slate-50 px-6 py-4">
                  {loadingPreview ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                      <div className="h-4 w-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                      Chargement des templates…
                    </div>
                  ) : previewSteps.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Aperçu de l'email</p>
                        {previewSteps.length > 1 && (
                          <div className="flex gap-1">
                            {previewSteps.map((step, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActivePreviewStep(idx)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                  activePreviewStep === idx
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {step.delayDays === 0 ? 'Immédiat' : `J+${step.delayDays}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {previewSteps[activePreviewStep] && (
                        <>
                          <p className="text-xs text-slate-400 mb-2 truncate">
                            Sujet : <span className="text-slate-600 font-medium">{previewSteps[activePreviewStep].subject}</span>
                          </p>
                          <div className="rounded-xl border border-slate-200 bg-white overflow-auto max-h-72 shadow-inner">
                            <iframe
                              srcDoc={previewSteps[activePreviewStep].html}
                              className="w-full h-64 border-0"
                              sandbox="allow-same-origin allow-scripts"
                              title="Aperçu email"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">
                      {automation.steps.length ? 'Templates introuvables en base.' : 'Aucun template associé à cette automatisation.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                    <Settings2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Automatisations email</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{automations.length} automatisation{automations.length !== 1 ? 's' : ''} configurée{automations.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAutomationModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1">
                {automations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                      <Zap className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Aucune automatisation</p>
                    <p className="text-xs text-slate-400 mt-1">Les automatisations sont configurées directement dans le code.</p>
                  </div>
                ) : (
                  <>
                    {/* Abonnement section */}
                    {abonnementAutomations.length > 0 && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-6 py-3 bg-slate-50 border-b border-slate-100">
                          Abonnement
                        </div>
                        {abonnementAutomations.map(auto => (
                          <AutomationRow key={auto.id} automation={auto} isObsolete={false} />
                        ))}
                      </div>
                    )}

                    {/* Séminaires section */}
                    {seminaireAutomations.length > 0 && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                          <span>Séminaires</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold normal-case tracking-normal">
                            <AlertTriangle className="h-3 w-3" />
                            Obsolètes
                          </span>
                        </div>
                        {seminaireAutomations.map(auto => (
                          <AutomationRow key={auto.id} automation={auto} isObsolete={true} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-3 bg-slate-50 flex-shrink-0">
                <p className="text-xs text-slate-400 text-center">
                  Les automatisations sont déclenchées automatiquement par les événements système. La configuration se fait dans le code.
                </p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Prévisualisation</h3>
                {subject && <p className="text-sm text-gray-500 mt-0.5">Sujet : <span className="font-medium text-gray-700">{subject}</span></p>}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                srcDoc={showMainHtmlMode ? html : (editorRef.current?.innerHTML || html)}
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
                title="Prévisualisation email"
                style={{ minHeight: '600px' }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen -m-6 md:-m-8">
        {/* Dark Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl animate-pulse -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-sky-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="relative">
            <AdminBackButton />
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65),inset_0_1px_0_rgba(255,255,255,0.12)] p-6 md:p-8">
              <p className="text-purple-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2"><Mail className="h-4 w-4" /> Admin — Mailing</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-indigo-200 bg-clip-text text-transparent">Mailing & Automatisations</h1>
              <p className="text-blue-300/70 text-sm mt-1.5">Envoyez des newsletters et créez des automatisations email</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent blur-sm" />
        </div>

        {/* Light body */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-100/90 via-sky-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="pointer-events-none absolute top-1/2 right-0 w-80 h-80 bg-sky-400/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
          <div className="relative space-y-6">

        {/* Result notification */}
        {result && (
          <div className={result.type === 'success' ? 'bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 text-emerald-800 rounded-xl p-4' : 'bg-red-50/80 backdrop-blur-sm border border-red-200/60 text-red-800 rounded-xl p-4'}>
            <div className="flex items-center justify-between">
              <span>{result.message}</span>
              <button onClick={() => setResult(null)} className="text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Newsletter Editor */}
        <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
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
                    className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none pr-10 appearance-none"
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
                    setShowHtmlMode(false)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all disabled:opacity-50"
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
                          setShowHtmlMode(false)
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 font-semibold hover:bg-white/90 shadow-sm transition-all"
                    >
                      <Edit2 className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(selectedTemplateId)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/90 backdrop-blur-sm border border-red-400/30 text-white font-semibold hover:bg-red-600/90 shadow-sm transition-all"
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
                className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires</label>
              <div className="flex gap-3 mb-3 flex-wrap">
                <button
                  onClick={() => setAudienceMode('manual')}
                  className={`px-4 py-2 rounded-xl border backdrop-blur-sm transition font-medium ${audienceMode === 'manual' ? 'bg-purple-500/20 border-purple-400/50 text-purple-700' : 'bg-white/60 border-blue-200/60 text-slate-700 hover:bg-white/80'}`}
                >
                  Manuel
                </button>
                <button
                  onClick={() => setAudienceMode('all')}
                  className={`px-4 py-2 rounded-xl border backdrop-blur-sm transition font-medium ${audienceMode === 'all' ? 'bg-purple-500/20 border-purple-400/50 text-purple-700' : 'bg-white/60 border-blue-200/60 text-slate-700 hover:bg-white/80'}`}
                >
                  Tous les membres
                </button>
                <button
                  onClick={() => setAudienceMode('subscription')}
                  className={`px-4 py-2 rounded-xl border backdrop-blur-sm transition font-medium ${audienceMode === 'subscription' ? 'bg-purple-500/20 border-purple-400/50 text-purple-700' : 'bg-white/60 border-blue-200/60 text-slate-700 hover:bg-white/80'}`}
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
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none"
                />
              )}

              {audienceMode === 'subscription' && (
                <select
                  value={subscriptionFilter}
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-300 outline-none"
                >
                  <option value="premium">Premium</option>
                  <option value="free">Gratuit</option>
                  <option value="newsletter_pre_launch">Newsletter pré-lancement</option>
                </select>
              )}
            </div>

            {/* HTML Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Contenu HTML</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Prévisualiser
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (showMainHtmlMode) {
                        // Switching from HTML textarea to visual: inject into div
                        if (editorRef.current) {
                          editorRef.current.innerHTML = html
                        }
                      } else {
                        // Switching from visual to HTML textarea: sync html state
                        if (editorRef.current) {
                          setHtml(editorRef.current.innerHTML)
                        }
                      }
                      setShowMainHtmlMode(!showMainHtmlMode)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition"
                  >
                    {showMainHtmlMode ? '👁️ Mode visuel' : '📝 Mode HTML'}
                  </button>
                </div>
              </div>

              {/* Formatting toolbar */}
              <div className="mb-2 space-y-2">
                <div className="flex items-center gap-2 p-3 bg-white/60 backdrop-blur-sm border-b border-white/40 rounded-t-lg flex-wrap">
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
                          { var: '{{nom}}', desc: 'Nom du plan (Premium)' },
                          { var: '{{prix}}', desc: 'Prix de l’abonnement (49,99€/mois)' },
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

              {showMainHtmlMode ? (
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={20}
                  className="w-full bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-b-xl px-4 py-3 focus:ring-2 focus:ring-purple-300 outline-none font-mono text-sm"
                  placeholder="Collez votre HTML ici..."
                />
              ) : (
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={(e) => setHtml(e.currentTarget.innerHTML)}
                  className="w-full min-h-[400px] p-6 bg-white/70 backdrop-blur-sm border border-blue-200/60 rounded-b-xl focus:outline-none overflow-y-auto"
                  suppressContentEditableWarning
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}
                />
              )}
              <p className="text-sm text-gray-500 mt-2">
                {showMainHtmlMode
                  ? '📝 Collez ou éditez votre HTML directement. Cliquez sur "Mode visuel" pour voir le rendu, ou "Prévisualiser" pour un aperçu complet.'
                  : '💡 Utilisez "Mode HTML" pour coller du code HTML complet, ou éditez directement ici.'}
              </p>
            </div>

            {/* Send button */}
            <div className="flex justify-end">
              <button
                onClick={handleSend}
                disabled={sending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/90 backdrop-blur-sm border border-purple-400/30 text-white font-semibold hover:bg-purple-600/90 shadow-sm transition-all disabled:opacity-50 text-lg"
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
        <div className="bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl ring-1 ring-inset ring-white/60 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Automatisations
              </h2>
              <p className="text-gray-600 mt-1">
                {automations.length > 0
                  ? `${automations.filter(a => a.active).length} active${automations.filter(a => a.active).length !== 1 ? 's' : ''} sur ${automations.length}`
                  : 'Séquences email déclenchées automatiquement'}
              </p>
            </div>
            <button
              onClick={() => setAutomationModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-blue-200/60 text-slate-700 font-semibold hover:bg-white/90 shadow-sm transition-all"
            >
              <Settings2 className="h-4 w-4" />
              Gérer les automatisations
            </button>
          </div>

          {/* Quick status preview */}
          {automations.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                    automation.active
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${automation.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {automation.name}
                </div>
              ))}
            </div>
          )}
        </div>

          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
