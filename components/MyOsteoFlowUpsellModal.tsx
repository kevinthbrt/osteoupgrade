'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  X, Laptop, Mic, Activity, Send, MessageSquare, Target, Receipt,
  BarChart3, Users, Brain, Lock, ArrowRight, Crown,
} from 'lucide-react'

const SEEN_KEY = 'myosteoflow_upsell_seen'

const features = [
  { icon: Mic, title: 'Dictée vocale par IA', desc: "Parlez pendant ou après la séance, l'IA transcrit et structure votre compte-rendu en temps réel." },
  { icon: Activity, title: 'Suivi patient automatisé', desc: "Un email envoyé automatiquement 7 jours après la séance pour mesurer douleur, mobilité et satisfaction." },
  { icon: Send, title: 'Courriers générés par IA', desc: "Courrier d'adressage ou attestation rédigés par l'IA à partir du dossier, en quelques secondes." },
  { icon: MessageSquare, title: 'Messagerie patients', desc: "Échangez avec vos patients depuis l'application, avec modèles de réponses et historique par dossier." },
  { icon: Target, title: "Objectifs & chiffre d'affaires", desc: 'Fixez vos objectifs de CA et suivez votre progression jour, semaine, mois.' },
  { icon: Receipt, title: 'Comptabilité & factures', desc: 'Factures PDF, paiements multiples ou fractionnés, exports CSV/Excel.' },
  { icon: BarChart3, title: 'Statistiques du cabinet', desc: "Démographie patients, motifs de consultation, jours de pointe, sources d'adressage." },
  { icon: Users, title: 'Dossiers patients complets', desc: 'Antécédents, anamnèse, historique de soins, topographie de la douleur, recherche instantanée.' },
  { icon: Brain, title: 'Assistance au raisonnement clinique', desc: "L'IA suggère les tests orthopédiques les plus pertinents selon le tableau clinique." },
  { icon: Lock, title: '100% local & RGPD', desc: 'Vos données restent sur votre machine, export et suppression RGPD en un clic.' },
]

export default function MyOsteoFlowUpsellModal({
  role,
  trialUsed
}: {
  role: string | null | undefined
  trialUsed?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (role === 'free' && !sessionStorage.getItem(SEEN_KEY)) {
      setOpen(true)
    }
  }, [role])

  if (!mounted || !open) return null

  const handleClose = () => {
    sessionStorage.setItem(SEEN_KEY, '1')
    setOpen(false)
  }

  const handleUpgrade = () => {
    sessionStorage.setItem(SEEN_KEY, '1')
    router.push('/settings/subscription')
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Laptop className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-violet-100 uppercase tracking-wide">Fonctionnalité Premium</p>
              <h2 className="font-bold text-white text-lg leading-tight">MyOsteoFlow — Logiciel de cabinet</h2>
            </div>
          </div>
          <button onClick={handleClose} className="shrink-0 p-1.5 rounded-lg text-violet-100 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!trialUsed && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-3">
              <Crown className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-900">
                <strong>Testez MyOsteoFlow gratuitement pendant 7 jours</strong> (carte requise, annulable à tout moment).
                Le reste du contenu Premium (cours, OsteoFlash…) reste réservé à l&apos;abonnement complet.
              </p>
            </div>
          )}
          <p className="text-sm text-slate-700 leading-relaxed mb-5">
            MyOsteoFlow est réservé aux comptes <strong>Premium</strong> (ou en essai). Passez premium pour gérer vos
            patients, consultations et dossiers directement depuis votre ordinateur, en plus de tout l&apos;accès
            OsteoUpgrade :
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl bg-violet-50 border border-violet-100 p-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between gap-3">
          <button onClick={handleClose} className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
            Plus tard
          </button>
          <button
            onClick={handleUpgrade}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold shadow hover:shadow-md transition-all"
          >
            <Crown className="h-4 w-4" />
            {trialUsed ? 'Passer Premium' : "Essayer 7 jours gratuitement"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
