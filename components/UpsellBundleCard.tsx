'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ArrowRight, Crown, GraduationCap, Stethoscope, X } from 'lucide-react'
import { planOf, type Plan } from '@/lib/entitlements'
import { BUNDLE_SAVING, formatAmount, offerOf } from '@/lib/offers'

/**
 * Proposition de passage au bundle, pour les abonnés à une seule des deux
 * offres.
 *
 * Volontairement discrète : une carte en coin d'écran, pas une modale qui
 * barre la page. Ces utilisateurs sont des clients payants, pas des prospects
 * — leur bloquer l'accès à ce qu'ils ont acheté pour leur vendre autre chose
 * se paierait en résiliations.
 *
 * Trois garde-fous :
 * - jamais avant quelques secondes de présence, pour ne pas s'ouvrir sur une
 *   page encore en chargement ;
 * - « Plus tard » silencieux pendant 14 jours ;
 * - « Ne plus proposer » définitif, respecté sans condition.
 */
const REPORT_KEY = 'upsell_bundle_report_jusqu_a'
const JAMAIS_KEY = 'upsell_bundle_jamais'
const DELAI_REPORT_MS = 14 * 24 * 60 * 60 * 1000
const DELAI_AFFICHAGE_MS = 4000

export default function UpsellBundleCard({ profile }: { profile: any }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const plan: Plan = planOf(profile)
  const eligible = plan === 'osteoflow' || plan === 'osteoupgrade'
  // Un essai en cours porte déjà son propre bandeau et sa propre échéance :
  // y superposer une proposition d'évolution ne ferait qu'embrouiller.
  const enEssai = profile?.subscription_status === 'trialing'

  useEffect(() => {
    setMounted(true)
    if (!eligible || enEssai) return

    try {
      if (localStorage.getItem(JAMAIS_KEY)) return
      const report = Number(localStorage.getItem(REPORT_KEY) || 0)
      if (report && Date.now() < report) return
    } catch {
      return
    }

    const timer = setTimeout(() => setOpen(true), DELAI_AFFICHAGE_MS)
    return () => clearTimeout(timer)
  }, [eligible, enEssai])

  if (!mounted || !open || !eligible) return null

  const manquante = plan === 'osteoflow' ? offerOf('osteoupgrade') : offerOf('osteoflow')
  const bundle = offerOf('bundle')
  if (!manquante || !bundle) return null

  const supplement = bundle.monthlyAmount - (offerOf(plan)?.monthlyAmount ?? 0)
  const Icone = plan === 'osteoflow' ? GraduationCap : Stethoscope

  const reporter = () => {
    try {
      localStorage.setItem(REPORT_KEY, String(Date.now() + DELAI_REPORT_MS))
    } catch {}
    setOpen(false)
  }

  const jamais = () => {
    try {
      localStorage.setItem(JAMAIS_KEY, '1')
    } catch {}
    setOpen(false)
  }

  const decouvrir = () => {
    reporter()
    router.push('/settings/subscription')
  }

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[150] w-[min(94vw,22rem)] animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-2.5 flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-yellow-900 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5" />
            Passer à l&apos;offre Premium
          </p>
          <button
            onClick={reporter}
            aria-label="Fermer"
            className="p-1 rounded-lg text-yellow-900/70 hover:text-yellow-900 hover:bg-yellow-300/50 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0">
              <Icone className="h-4.5 w-4.5 text-white" />
            </div>
            <p className="text-sm text-slate-700 leading-snug">
              Ajoutez <strong>{manquante.name}</strong> à votre abonnement pour{' '}
              <strong>{formatAmount(supplement)} de plus par mois</strong> — soit{' '}
              {formatAmount(BUNDLE_SAVING.savedAmount)}/mois de moins que de le prendre séparément.
            </p>
          </div>

          <ul className="space-y-1 mb-4">
            {manquante.features.slice(0, 3).map((f) => (
              <li key={f} className="text-xs text-slate-500 flex items-start gap-1.5">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={decouvrir}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-900 text-sm font-bold hover:from-yellow-600 hover:to-yellow-700 transition shadow"
          >
            Voir l&apos;offre Premium
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex items-center justify-between mt-3">
            <button onClick={reporter} className="text-xs font-medium text-slate-500 hover:text-slate-700 transition">
              Plus tard
            </button>
            <button onClick={jamais} className="text-xs text-slate-400 hover:text-slate-600 transition">
              Ne plus me proposer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
