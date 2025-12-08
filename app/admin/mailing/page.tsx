'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  FilePlus2,
  Flame,
  Link2,
  Image as ImageIcon,
  Loader2,
  Mail,
  Palette,
  Paperclip,
  PlayCircle,
  Rocket,
  Send,
  Shield,
  Sparkles,
  X,
  Trash2,
  Wand2,
  Plus,
  Clock4
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
  { label: 'Sur free depuis 14 jours', value: 'Sur free depuis 14 jours' }
]

const inlineImageStyle = 'display:block;max-width:640px;width:100%;height:auto;margin:12px 0;'

export default function MailingAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [toInput, setToInput] = useState('')
  const [fromInput] = useState<string>(process.env.NEXT_PUBLIC_RESEND_FROM || '')
  const [templates, setTemplates] = useState<Template[]>([])
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [text, setText] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [audienceMode, setAudienceMode] = useState<'manual' | 'all' | 'subscription'>('manual')
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('premium_silver')
  const [members, setMembers] = useState<{ email: string; role: string; subscription_status: string | null }[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [automationDraft, setAutomationDraft] = useState<Omit<Automation, 'id' | 'active'>>({
    name: '',
    trigger: automationTriggerPresets[0]?.value || '',
    audience: 'Tous les membres',
    schedule: 'Démarrage immédiat',
    steps: []
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
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [templateHtmlManuallyEdited, setTemplateHtmlManuallyEdited] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const editorRef = useRef<HTMLDivElement>(null)
  const templateEditorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const [automationModalOpen, setAutomationModalOpen] = useState(false)

  const extractTextFromHtml = (content: string) => {
    const element = document.createElement('div')
    element.innerHTML = content
    return element.innerText
  }

  const generateTemplateHtml = (name: string, description: string, subject: string) => {
    const safeName = name || 'Nouveau template'
    const safeSubject = subject || 'Sujet personnalisé'
    const safeDescription = description || 'Ajoutez une description pour personnaliser ce template.'

    return `
      <div style="font-family: Inter, sans-serif; color: #0f172a;">
        <h2 style="color:#2563eb;">${safeSubject}</h2>
        <p>${safeDescription}</p>
        <p style="margin-top: 12px;">Merci,</p>
        <p><strong>${safeName}</strong></p>
      </div>
    `
  }

  const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

  const mapTemplateRowToTemplate = (row: any): Template => ({
    id: row.id,
    name: row.name,
    subject: row.subject,
    description: row.description || '',
    html: row.html || '',
    text: row.text || ''
  })

  const loadTemplatesFromSupabase = async () => {
    setLoadingTemplates(true)
    try {
      const { data, error } = await supabase
        .from('mail_templates')
        .select('id, name, subject, description, html, text')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur de chargement des templates Supabase', error)
        setResult({ type: 'error', message: "Impossible de charger les templates enregistrés." })
        return
      }

      if (data) {
        const remoteTemplates = data.map(mapTemplateRowToTemplate)
        setTemplates(remoteTemplates)

        const existingSelection = remoteTemplates.find((tpl) => tpl.id === selectedTemplate)
        const fallbackTemplate = existingSelection || remoteTemplates[0]

        if (fallbackTemplate) {
          setSelectedTemplate(fallbackTemplate.id)
          setSubject(fallbackTemplate.subject)
          setHtml(fallbackTemplate.html)
          setText(fallbackTemplate.text || extractTextFromHtml(fallbackTemplate.html))
        }
      }
    } finally {
      setLoadingTemplates(false)
    }
  }

  const loadAutomationsFromAPI = async () => {
    try {
      const response = await fetch('/api/automations')
      if (!response.ok) {
        console.error('Error loading automations')
        return
      }

      const { automations: loadedAutomations } = await response.json()

      // Mapper les automatisations de l'API vers le format local
      const mappedAutomations = loadedAutomations.map((auto: any) => ({
        id: auto.id,
        name: auto.name,
        trigger: auto.trigger_event,
        audience: 'Tous les membres', // À améliorer
        schedule: 'Démarrage immédiat', // À améliorer
        steps: (auto.steps || []).map((step: any) => ({
          id: step.id,
          templateId: step.template_slug || '',
          delayDays: Math.floor(step.wait_minutes / (60 * 24))
        })),
        active: auto.active
      }))

      setAutomations(mappedAutomations)
    } catch (error) {
      console.error('Error loading automations:', error)
    }
  }

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/')
          return
        }

        setCurrentUserId(user.id)

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

        await loadTemplatesFromSupabase()
        await loadAutomationsFromAPI()
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  const applyTemplate = (templateId: string | null) => {
    if (!templateId) {
      setSelectedTemplate(null)
      setSubject('')
      setHtml('')
      setText('')
      return
    }

    const template = templates.find((tpl) => tpl.id === templateId)
    if (!template) return
    setSelectedTemplate(template.id)
    setSubject(template.subject)
    setHtml(template.html)
    setText(template.text || extractTextFromHtml(template.html))
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

  const activeTemplate = useMemo(
    () => (selectedTemplate ? templates.find((tpl) => tpl.id === selectedTemplate) : undefined),
    [selectedTemplate, templates]
  )

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html
    }
  }, [html])

  useEffect(() => {
    if (!templateModalOpen || !templateEditorRef.current) return

    if (templateEditorRef.current.innerHTML !== (templateDraft.html || '')) {
      templateEditorRef.current.innerHTML = templateDraft.html || ''
    }
  }, [templateDraft.html, templateModalOpen])

  useEffect(() => {
    if (!templateModalOpen || templateHtmlManuallyEdited) return

    setTemplateDraft((prev) => ({
      ...prev,
      html: generateTemplateHtml(prev.name, prev.description, prev.subject)
    }))
  }, [templateDraft.name, templateDraft.description, templateDraft.subject, templateModalOpen, templateHtmlManuallyEdited])

  const applyFormatting = (
    command: string,
    value?: string,
    options?: {
      target?: React.RefObject<HTMLDivElement>
      onChange?: (html: string, text: string) => void
    }
  ) => {
    const target = options?.target?.current ?? editorRef.current
    if (!target) return
    target.focus()
    document.execCommand(command, false, value)
    const htmlContent = target.innerHTML
    const textContent = target.innerText

    if (options?.onChange) {
      options.onChange(htmlContent, textContent)
      return
    }

    setHtml(htmlContent)
    setText(textContent)
  }

  const updateTemplateContent = (htmlContent: string, textContent: string) => {
    setTemplateDraft((prev) => ({ ...prev, html: htmlContent, text: textContent }))
    setTemplateHtmlManuallyEdited(true)
  }

  const handleImageInsert = () => {
    const url = window.prompt('URL de l’image à insérer dans le mail')
    if (url) {
      applyFormatting('insertImage', url)
    }
  }

  const handleButtonInsert = () => {
    const label = window.prompt('Texte du bouton') || 'Découvrir'
    const url = window.prompt('Lien du bouton (https://...)') || 'https://osteoupgrade.app'

    applyFormatting(
      'insertHTML',
      `<p style="margin: 12px 0;"><a href="${url}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;">${label}</a></p>`
    )
  }

  const applyTemplateFormatting = (command: string, value?: string) =>
    applyFormatting(command, value, {
      target: templateEditorRef,
      onChange: updateTemplateContent
    })

  const handleTemplateButtonInsert = () => {
    const label = window.prompt('Texte du bouton') || 'Découvrir'
    const url = window.prompt('Lien du bouton (https://...)') || 'https://osteoupgrade.app'

    applyFormatting(
      'insertHTML',
      `<p style="margin: 12px 0;"><a href="${url}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;">${label}</a></p>`,
      {
        target: templateEditorRef,
        onChange: updateTemplateContent
      }
    )
  }

  const handleFileImageInsert = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      if (!base64) return

      const cid = `inline-${Date.now()}-${Math.random().toString(16).slice(2)}`

      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          content: base64,
          type: file.type,
          cid,
          disposition: 'inline'
        }
      ])

      applyFormatting(
        'insertHTML',
        `<img src="${result}" data-inline-cid="${cid}" alt="${file.name}" style="${inlineImageStyle}" />`
      )
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string)?.split(',')[1]
        if (!base64) return
        setAttachments((prev) => [
          ...prev,
          { name: file.name, content: base64, type: file.type, disposition: 'attachment' }
        ])
      }
      reader.readAsDataURL(file)
    })

    event.target.value = ''
  }

  const removeAttachmentAt = (index: number) => {
    setAttachments((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleEditorInput = (event: React.FormEvent<HTMLDivElement>) => {
    const content = event.currentTarget.innerHTML
    setHtml(content)
    setText(event.currentTarget.innerText)
  }

  const handleTemplateEditorInput = (event: React.FormEvent<HTMLDivElement>) => {
    const content = event.currentTarget.innerHTML
    updateTemplateContent(content, event.currentTarget.innerText)
  }

  const resetTemplateDraft = () => {
    setTemplateDraft({ id: '', name: '', subject: '', description: '', html: '', text: '' })
    setEditingTemplateId(null)
    setTemplateModalOpen(false)
    setTemplateHtmlManuallyEdited(false)
  }

  const startTemplateEdit = (template: Template) => {
    setEditingTemplateId(template.id)
    setTemplateDraft(template)
    setTemplateHtmlManuallyEdited(true)
    setTemplateModalOpen(true)
  }

  const startTemplateCreation = () => {
    setTemplateDraft({ id: '', name: '', subject: '', description: '', html: '', text: '' })
    setEditingTemplateId(null)
    setTemplateModalOpen(true)
    setTemplateHtmlManuallyEdited(false)
  }

  const saveTemplate = async () => {
    if (!templateDraft.name || !templateDraft.subject || !templateDraft.html) {
      setResult({ type: 'error', message: 'Complétez au moins le nom, le sujet et le contenu HTML du template.' })
      return
    }

    const resolvedText = templateDraft.text || extractTextFromHtml(templateDraft.html)
    setTemplateSaving(true)

    try {
      const shouldUpdateExisting = editingTemplateId ? isUuid(editingTemplateId) : false
      const { data, error } = await supabase
        .from('mail_templates')
        .upsert({
          id: shouldUpdateExisting ? editingTemplateId || undefined : undefined,
          name: templateDraft.name,
          subject: templateDraft.subject,
          description: templateDraft.description,
          html: templateDraft.html,
          text: resolvedText,
          created_by: currentUserId || undefined
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      const savedTemplate: Template = {
        ...templateDraft,
        id: data?.id || editingTemplateId || `custom-${Date.now()}`,
        text: resolvedText
      }

      setTemplates((prev) => {
        const filtered = prev.filter((tpl) => tpl.id !== savedTemplate.id)
        return [...filtered, savedTemplate]
      })

      setResult({ type: 'success', message: 'Template enregistré dans Supabase.' })
      resetTemplateDraft()
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du template', error)
      setResult({ type: 'error', message: error?.message || 'Impossible de sauvegarder le template.' })
    } finally {
      setTemplateSaving(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    setTemplates((prev) => {
      const filtered = prev.filter((tpl) => tpl.id !== templateId)

      if (selectedTemplate === templateId) {
        const fallback = filtered[0]
        setSelectedTemplate(fallback?.id || null)
        setSubject(fallback?.subject || '')
        setHtml(fallback?.html || '')
        setText(fallback?.text || '')
      }

      return filtered
    })

    if (isUuid(templateId)) {
      const { error } = await supabase.from('mail_templates').delete().eq('id', templateId)
      if (error) {
        setResult({ type: 'error', message: 'Suppression locale effectuée, mais Supabase a rejeté la requête.' })
      }
    }
  }

  const startAutomationCreation = () => {
    setAutomationDraft({
      name: '',
      trigger: automationTriggerPresets[0]?.value || '',
      audience: 'Tous les membres',
      schedule: 'Démarrage immédiat',
      steps: [
        {
          id: `step-${Date.now()}`,
          templateId: templates[0]?.id || '',
          delayDays: 0
        }
      ]
    })
    setAutomationModalOpen(true)
  }

  const addAutomationStep = () => {
    const lastDelay = automationDraft.steps[automationDraft.steps.length - 1]?.delayDays ?? 0
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

  const closeAutomationModal = () => {
    setAutomationModalOpen(false)
    setAutomationDraft({
      name: '',
      trigger: automationTriggerPresets[0]?.value || '',
      audience: 'Tous les membres',
      schedule: 'Démarrage immédiat',
      steps: []
    })
  }

  const handleAutomationSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!automationDraft.name || !automationDraft.trigger || automationDraft.steps.length === 0) return

    try {
      // Convertir les étapes au format API
      const steps = automationDraft.steps.map((step, index) => ({
        step_order: index,
        wait_minutes: step.delayDays * 24 * 60, // Convertir jours en minutes
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

      if (!response.ok) {
        throw new Error('Impossible de créer l\'automatisation')
      }

      const { automation } = await response.json()

      // Mapper vers le format local et ajouter à la liste
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
      setResult({ type: 'success', message: 'Automatisation créée avec succès !' })
      closeAutomationModal()
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || 'Erreur lors de la création de l\'automatisation' })
    }
  }

  const toggleAutomation = async (automationId: string) => {
    const automation = automations.find(a => a.id === automationId)
    if (!automation) return

    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !automation.active
        })
      })

      if (!response.ok) {
        throw new Error('Impossible de mettre à jour l\'automatisation')
      }

      setAutomations((prev) => prev.map((auto) => (auto.id === automationId ? { ...auto, active: !auto.active } : auto)))
      setResult({ type: 'success', message: `Automatisation ${!automation.active ? 'activée' : 'désactivée'}` })
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || 'Erreur lors de la mise à jour' })
    }
  }

  const deleteAutomation = async (automationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette automatisation ?')) return

    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Impossible de supprimer l\'automatisation')
      }

      setAutomations((prev) => prev.filter((automation) => automation.id !== automationId))
      setResult({ type: 'success', message: 'Automatisation supprimée' })
    } catch (error: any) {
      setResult({ type: 'error', message: error?.message || 'Erreur lors de la suppression' })
    }
  }

  const getTemplateName = (templateId: string) =>
    templates.find((template) => template.id === templateId)?.name || 'Template personnalisé'

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

    const prepareInlineImagesForSend = (content: string) => {
      const container = document.createElement('div')
      container.innerHTML = content

      container.querySelectorAll('img[data-inline-cid]').forEach((img) => {
        const cid = img.getAttribute('data-inline-cid')
        if (!cid) return

        const existingStyle = img.getAttribute('style') || ''
        const mergedStyle = `${existingStyle ? `${existingStyle};` : ''}${inlineImageStyle}`

        img.setAttribute('src', `cid:${cid}`)
        img.removeAttribute('data-inline-cid')
        img.setAttribute('style', mergedStyle)
      })

      return container.innerHTML
    }

    setSending(true)
    try {
      const plainText = text || extractTextFromHtml(html)
      const htmlForSend = prepareInlineImagesForSend(html)
      const response = await fetch('/api/mailing/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject,
          html: htmlForSend,
          text: plainText,
          from: fromInput,
          tags: ['admin-send'],
          attachments: attachments.map((file) => ({
            filename: file.name,
            content: file.content,
            type: file.type,
            cid: file.cid,
            content_id: file.cid,
            disposition: file.disposition
          }))
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Impossible d\'envoyer l\'email.')
      }

      setResult({ type: 'success', message: 'Email envoyé via Resend. Vérifiez votre boîte de réception.' })
      setAttachments([])
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
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-sm p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Mail className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Mailing & Newsletter</h1>
              </div>
              <p className="text-primary-100 max-w-3xl">
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

        <div className="space-y-6">
          <form onSubmit={handleSend} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-900">Rédaction grand format</p>
              <p className="text-sm text-gray-700">Composez vos newsletters dans un espace dégagé, avec vos modèles accessibles directement.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Destinataires</label>
                <p className="text-xs text-gray-700">{selectedRecipients.length} contact(s) sélectionné(s)</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceMode('manual')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-left ${audienceMode === 'manual' ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-gray-200'}`}
                >
                  Saisie manuelle
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceMode('all')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-left ${audienceMode === 'all' ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-gray-200'}`}
                >
                  Tous les membres
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceMode('subscription')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-left ${audienceMode === 'subscription' ? 'border-primary-500 bg-primary-50 text-primary-900' : 'border-gray-200'}`}
                >
                  Par abonnement
                </button>
              </div>

              {audienceMode === 'manual' && (
                <div className="space-y-1">
                  <input
                    type="text"
                    aria-label="Liste des destinataires"
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    placeholder="ex: contact@domaine.com, demo@osteoupgrade.app"
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-700">Séparez les emails par des virgules.</p>
                </div>
              )}

              {audienceMode === 'all' && (
                <div className="rounded-lg border border-dashed border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
                  {members.length ? `${members.length} membres sélectionnés automatiquement.` : 'Chargement des membres...'}
                </div>
              )}

              {audienceMode === 'subscription' && (
                <div className="space-y-2">
                  <select
                    aria-label="Filtrer les abonnements"
                    value={subscriptionFilter}
                    onChange={(e) => setSubscriptionFilter(e.target.value)}
                    className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="premium_silver">Premium Silver</option>
                    <option value="premium_gold">Premium Gold</option>
                    <option value="free">Membres gratuits</option>
                    <option value="admin">Admins</option>
                  </select>
                  <p className="text-xs text-gray-700">Envoi ciblé par type d’abonnement (subscription_status) ou rôle.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-primary-200 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Wand2 className="h-4 w-4 text-primary-500" />
                  <span>Template & sujet</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={startTemplateCreation}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 font-semibold text-primary-700 hover:bg-primary-100"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Nouveau
                  </button>
                  <button
                    type="button"
                    disabled={!activeTemplate}
                    onClick={() => activeTemplate && startTemplateEdit(activeTemplate)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-semibold disabled:opacity-50"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    disabled={!activeTemplate}
                    onClick={() => activeTemplate && deleteTemplate(activeTemplate.id)}
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <select
                  aria-label="Choisir un template"
                  value={selectedTemplate ?? ''}
                  onChange={(e) => applyTemplate(e.target.value || null)}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="">Aucun template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-700 md:w-48">
                  {loadingTemplates ? 'Chargement des templates...' : `${templates.length} template(s) disponible(s)`}
                </p>
              </div>
              {activeTemplate?.description && <p className="text-xs text-gray-700">{activeTemplate.description}</p>}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Sujet</label>
                <input
                  type="text"
                  aria-label="Sujet de la newsletter"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Zone de rédaction</label>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <ImageIcon className="h-4 w-4" />
                  <span>Grand format avec mise en forme enrichie</span>
                </div>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <select
                    aria-label="Police"
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
                    aria-label="Taille de police"
                    onChange={(e) => applyFormatting('fontSize', e.target.value)}
                    className="rounded border-gray-300 text-xs"
                    defaultValue="3"
                  >
                    <option value="2">Petit</option>
                    <option value="3">Normal</option>
                    <option value="4">Grand</option>
                    <option value="5">Très grand</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => applyFormatting('bold')}
                    className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200 font-semibold"
                  >
                    Gras
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('italic')}
                    className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200 italic"
                  >
                    Italique
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('underline')}
                    className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                  >
                    Souligné
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('insertUnorderedList')}
                    className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                  >
                    Liste
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('insertOrderedList')}
                    className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                  >
                    Liste numérotée
                  </button>
                  <label className="flex items-center gap-1 text-xs px-2 py-1 border rounded cursor-pointer bg-white">
                    <Palette className="h-4 w-4 text-gray-600" />
                    <span>Couleur</span>
                    <input
                      type="color"
                      onChange={(e) => applyFormatting('foreColor', e.target.value)}
                      className="h-0 w-0 opacity-0"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleButtonInsert}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                  >
                    <Link2 className="h-4 w-4" />
                    Bouton lien
                  </button>
                  <button
                    type="button"
                    onClick={handleImageInsert}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Parcourir...
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileImageInsert}
                  />
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[420px] w-full bg-white p-5 focus:outline-none text-gray-900"
                  onInput={handleEditorInput}
                />
              </div>
              <p className="text-xs text-gray-700">Visualisez directement votre email dans la zone de rédaction sans prévisualisation séparée.</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Paperclip className="h-4 w-4" />
                <span>Pièces jointes</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded border border-dashed border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Paperclip className="h-4 w-4" />
                  Ajouter des pièces jointes
                </button>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentSelect}
                />
                <p className="text-xs text-gray-700">Formats supportés: images, PDF, documents. Encodage automatique en base64.</p>
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <span
                      key={`${file.name}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                    >
                      {file.name}
                      {file.disposition === 'inline' && <span className="text-[10px] text-primary-600">(inline)</span>}
                      <button
                        type="button"
                        aria-label={`Retirer la pièce jointe ${file.name}`}
                        onClick={() => removeAttachmentAt(index)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <Sparkles className="h-4 w-4 text-primary-500" />
                <span>Envoi via Resend activé</span>
              </div>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{sending ? 'Envoi en cours...' : 'Envoyer via Resend'}</span>
              </button>
            </div>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <PlayCircle className="h-5 w-5 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-lg">Automatisations</h3>
                  <p className="text-sm text-gray-700">Programmez vos séquences juste sous la zone de rédaction.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={startAutomationCreation}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
              >
                <Rocket className="h-4 w-4" />
                Nouvelle automatisation
              </button>
            </div>
            <div className="space-y-3">
              {automations.length === 0 && (
                <p className="text-sm text-gray-700">Aucune automatisation pour le moment.</p>
              )}
              {automations.map((automation) => (
                <div key={automation.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">{automation.name}</p>
                      <p className="text-xs text-gray-700">Déclencheur: {automation.trigger || 'Non défini'} · Audience: {automation.audience || 'Tous'} · Planification: {automation.schedule || 'Manuelle'}</p>
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
                        aria-label="Supprimer cette automatisation"
                        onClick={() => deleteAutomation(automation.id)}
                        className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock4 className="h-4 w-4" />
                      <span>{automation.steps.length} emails programmés</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {automation.steps.map((step) => (
                        <div key={step.id} className="rounded border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs">
                          <p className="font-semibold text-gray-800">{getTemplateName(step.templateId)}</p>
                          <p className="text-[11px] text-gray-700">Envoi à J+{step.delayDays}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <FilePlus2 className="h-5 w-5 text-primary-600" />
                <p className="font-semibold">{editingTemplateId ? 'Modifier un template' : 'Créer un template'}</p>
              </div>
              <button
                type="button"
                aria-label="Fermer le modal de template"
                onClick={resetTemplateDraft}
                className="rounded p-1 text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  type="text"
                  aria-label="Nom du template"
                  placeholder="Nom"
                  value={templateDraft.name}
                  onChange={(e) => setTemplateDraft({ ...templateDraft, name: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
                <input
                  type="text"
                  aria-label="Sujet du template"
                  placeholder="Sujet"
                  value={templateDraft.subject}
                  onChange={(e) => setTemplateDraft({ ...templateDraft, subject: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
              <input
                type="text"
                aria-label="Description du template"
                placeholder="Description"
                value={templateDraft.description}
                onChange={(e) => setTemplateDraft({ ...templateDraft, description: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Contenu HTML</p>
                  <span className="text-xs text-gray-700">Mise en forme rapide</span>
                </div>
                <div className="rounded-lg border border-gray-200">
                  <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    <button
                      type="button"
                      onClick={() => applyTemplateFormatting('bold')}
                      className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200 font-semibold"
                    >
                      Gras
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplateFormatting('italic')}
                      className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200 italic"
                    >
                      Italique
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplateFormatting('underline')}
                      className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                    >
                      Souligné
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplateFormatting('insertUnorderedList')}
                      className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                    >
                      Liste
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTemplateFormatting('insertOrderedList')}
                      className="rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                    >
                      Liste numérotée
                    </button>
                    <label className="flex items-center gap-1 text-xs px-2 py-1 border rounded cursor-pointer bg-white">
                      <Palette className="h-4 w-4 text-gray-600" />
                      <span>Couleur</span>
                      <input
                        type="color"
                        onChange={(e) => applyTemplateFormatting('foreColor', e.target.value)}
                        className="h-0 w-0 opacity-0"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleTemplateButtonInsert}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-gray-900 hover:bg-gray-200"
                    >
                      <Link2 className="h-4 w-4" />
                      Bouton lien
                    </button>
                  </div>
                  <div
                    ref={templateEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[200px] w-full p-3 focus:outline-none"
                    onInput={handleTemplateEditorInput}
                  />
                </div>
                <p className="text-xs text-gray-700">
                  Le HTML se remplit automatiquement à partir du sujet et de la description. Vous pouvez ensuite l’ajuster avec les boutons ci-dessus.
                </p>
              </div>
              <textarea
                placeholder="Texte brut (optionnel)"
                value={templateDraft.text}
                onChange={(e) => setTemplateDraft({ ...templateDraft, text: e.target.value })}
                className="w-full h-24 rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
              <div className="flex items-center justify-between text-xs text-gray-700">
                <p>Personnalisez le contenu HTML en quelques clics ou ajustez le texte brut pour les clients email limités.</p>
                {editingTemplateId && (
                  <button type="button" onClick={resetTemplateDraft} className="text-primary-600 underline">
                    Annuler
                  </button>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetTemplateDraft}
                  className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={saveTemplate}
                  disabled={templateSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4" />
                  {templateSaving ? 'Sauvegarde...' : editingTemplateId ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {automationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary-600" />
                <p className="font-semibold">Programmer une automatisation</p>
              </div>
              <button
                type="button"
                aria-label="Fermer le modal d'automatisation"
                onClick={closeAutomationModal}
                className="rounded p-1 text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form className="space-y-4 p-4" onSubmit={handleAutomationSubmit}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input
                  type="text"
                  aria-label="Nom de l'automatisation"
                  placeholder="Nom de l'automatisation"
                  value={automationDraft.name}
                  onChange={(e) => setAutomationDraft({ ...automationDraft, name: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                />
                <select
                  aria-label="Déclencheur de l'automatisation"
                  value={automationDraft.trigger}
                  onChange={(e) => setAutomationDraft({ ...automationDraft, trigger: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  required
                >
                  {automationTriggerPresets.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select
                  aria-label="Audience de l'automatisation"
                  value={automationDraft.audience}
                  onChange={(e) => setAutomationDraft({ ...automationDraft, audience: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="Tous les membres">Tous les membres</option>
                  <option value="Premium">Premium</option>
                  <option value="Free">Free</option>
                  <option value="Admins">Admins</option>
                </select>
                <input
                  type="text"
                  aria-label="Planification de l'automatisation"
                  placeholder="Planification (ex: démarrage immédiat)"
                  value={automationDraft.schedule}
                  onChange={(e) => setAutomationDraft({ ...automationDraft, schedule: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Séquence d'emails</p>
                  <button
                    type="button"
                    onClick={addAutomationStep}
                    className="inline-flex items-center gap-1 rounded border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un email
                  </button>
                </div>
                <div className="space-y-2">
                  {automationDraft.steps.map((step, index) => (
                    <div key={step.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">Email #{index + 1}</p>
                        {automationDraft.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAutomationStep(step.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 mt-2">
                        <select
                          aria-label={`Template pour l'email ${index + 1}`}
                          value={step.templateId}
                          onChange={(e) => updateAutomationStep(step.id, { templateId: e.target.value })}
                          className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                        >
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Délais (jours)</label>
                          <input
                            type="number"
                            aria-label={`Délais en jours pour l'email ${index + 1}`}
                            min={0}
                            value={step.delayDays}
                            onChange={(e) => updateAutomationStep(step.id, { delayDays: Number(e.target.value) })}
                            className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-700">Choisissez un déclencheur puis planifiez chaque email avec un délai en jours (J+0, J+3, etc.).</p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAutomationModal}
                  className="rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
