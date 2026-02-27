'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles, Wrench, Zap } from 'lucide-react'

type ChangeType = 'feature' | 'fix' | 'improvement'

type ChangelogEntry = {
  date: string
  changes: {
    type: ChangeType
    text: string
  }[]
}

// ─────────────────────────────────────────────
// 🔖 INCRÉMENTER cette valeur à chaque mise à jour
const CHANGELOG_VERSION = 2
// ─────────────────────────────────────────────

const CHANGELOG: ChangelogEntry[] = [
  {
    date: '27 février 2026',
    changes: [
      {
        type: 'feature',
        text: 'Mot de passe oublié — nouveau lien sur l\'écran de connexion permettant de recevoir un email de réinitialisation, et nouvelle page dédiée pour définir un nouveau mot de passe'
      }
    ]
  },
  {
    date: '27 février 2026',
    changes: [
      {
        type: 'feature',
        text: 'Tests orthopédiques ajouté dans la navigation E-Learning (section E-Learning)'
      },
      {
        type: 'fix',
        text: 'Retours à la ligne désormais respectés dans les revues de littérature (introduction, contexte, méthodologie, résultats, implications, conclusion, résumé)'
      },
      {
        type: 'feature',
        text: 'Fenêtre changelog pour les admins — apparaît automatiquement à chaque mise à jour de la plateforme'
      }
    ]
  }
]

const TYPE_CONFIG: Record<ChangeType, { label: string; color: string; icon: React.ReactNode }> = {
  feature: {
    label: 'Nouveau',
    color: 'bg-emerald-100 text-emerald-700',
    icon: <Sparkles className="h-3.5 w-3.5" />
  },
  fix: {
    label: 'Correction',
    color: 'bg-amber-100 text-amber-700',
    icon: <Wrench className="h-3.5 w-3.5" />
  },
  improvement: {
    label: 'Amélioration',
    color: 'bg-blue-100 text-blue-700',
    icon: <Zap className="h-3.5 w-3.5" />
  }
}

const STORAGE_KEY = 'admin_changelog_seen_v'

export default function AdminChangelogModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const checkAndShow = async () => {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' })
        if (!res.ok) return

        const { profile } = await res.json()
        if (profile?.role !== 'admin') return

        const seen = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10)
        if (seen < CHANGELOG_VERSION) {
          setShow(true)
        }
      } catch {
        // fail silently
      }
    }

    checkAndShow()
  }, [])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, String(CHANGELOG_VERSION))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Nouveautés</h2>
              <p className="text-slate-400 text-xs">Mises à jour de la plateforme</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Changelog entries */}
        <div className="px-6 py-5 space-y-7 max-h-[60vh] overflow-y-auto">
          {CHANGELOG.map((entry, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-slate-900">{entry.date}</span>
                {i === 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                    Récent
                  </span>
                )}
              </div>
              <ul className="space-y-3">
                {entry.changes.map((change, j) => {
                  const config = TYPE_CONFIG[change.type]
                  return (
                    <li key={j} className="flex items-start gap-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 mt-0.5 ${config.color}`}
                      >
                        {config.icon}
                        {config.label}
                      </span>
                      <span className="text-sm text-slate-700 leading-relaxed">
                        {change.text}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  )
}
