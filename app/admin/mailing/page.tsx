'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Loader2,
  Mail,
  Rocket,
  Send,
  Shield,
  Sparkles,
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

const templates: Template[] = [
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
  const [subject, setSubject] = useState(templates[0].subject)
  const [html, setHtml] = useState(templates[0].html)
  const [text, setText] = useState(templates[0].text || '')
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  const checklist = useMemo(
    () => [
      {
        label: 'Configurer RESEND_API_KEY dans Vercel ou .env.local',
        done: true,
      },
      {
        label: 'Définir un expéditeur (RESEND_FROM) et un domaine vérifié',
        done: true,
      },
      {
        label: 'Envoyer un test pour valider la délivrabilité',
        done: !!result && result.type === 'success'
      }
    ],
    [result]
  )

  const applyTemplate = (templateId: string) => {
    const template = templates.find((tpl) => tpl.id === templateId)
    if (!template) return
    setSelectedTemplate(template.id)
    setSubject(template.subject)
    setHtml(template.html)
    setText(template.text || '')
  }

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault()
    setResult(null)

    const recipients = toInput
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)

    if (!recipients.length) {
      setResult({ type: 'error', message: 'Ajoutez au moins un destinataire (séparés par des virgules).' })
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
        body: JSON.stringify({ to: recipients, subject, html, text, tags: ['admin-send'] })
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
                Envoyez vos newsletters, relances et séquences de manière fiable via Resend. Le module est prêt : ajoutez vos destinataires et cliquez sur envoyer.
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
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span>Resend activé</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Destinataires</label>
                <input
                  type="text"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="ex: contact@domaine.com, demo@osteoupgrade.app"
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-500">Séparez les emails par des virgules.</p>
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
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Contenu HTML</label>
                  <textarea
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    className="w-full h-64 rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Version texte (optionnel)</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full h-64 rounded-lg border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
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

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Rocket className="h-5 w-5 text-purple-600" />
                <h2 className="font-semibold">Aperçu HTML</h2>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-[420px] overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Templates express</h3>
              </div>
              <div className="space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template.id)}
                    className={`w-full text-left border rounded-lg p-3 hover:border-purple-500 transition ${
                      selectedTemplate === template.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{template.name}</p>
                        <p className="text-sm text-gray-500">{template.subject}</p>
                      </div>
                      <Wand2 className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Checklist Resend</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-start space-x-2">
                    <span className={`mt-0.5 h-4 w-4 rounded-full border ${item.done ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'}`}>
                      {item.done && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
