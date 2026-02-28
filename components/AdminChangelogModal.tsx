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
const CHANGELOG_VERSION = 5
// ─────────────────────────────────────────────

const CHANGELOG: ChangelogEntry[] = [
  {
    date: '28 février 2026',
    changes: [
      {
        type: 'fix',
        text: 'Module Pratique — fiabilisation des miniatures Vimeo : récupération serveur via oEmbed de `vimeo_id`, `thumbnail_url` et `duration_seconds`, pour éviter les cartes noires/aléatoires.'
      },
      {
        type: 'improvement',
        text: 'Module Pratique (admin) — à la création/édition d’une vidéo, les métadonnées Vimeo sont désormais pré-remplies et enregistrées automatiquement à partir de l’URL Vimeo.'
      },
      {
        type: 'fix',
        text: 'Module Pratique — fallback visuel renforcé : si une miniature échoue au chargement, affichage automatique d’un placeholder local.'
      },
      {
        type: 'improvement',
        text: 'Maintenance — ajout d’un script de backfill pour compléter les anciennes vidéos sans miniature/ID/durée Vimeo directement en base.'
      }
    ]
  },
  {
    date: '28 février 2026',
    changes: [
      {
        type: 'feature',
        text: 'Module Pratique — lecteur vidéo en modal : cliquer sur une miniature ouvre la vidéo dans une fenêtre superposée, fermable avec la croix ou la touche Échap. Navigation entre vidéos avec les flèches clavier ou les boutons.'
      },
      {
        type: 'feature',
        text: 'Module Pratique — formulaire admin en modal : "Ajouter une vidéo" et "Modifier" ouvrent désormais un formulaire dans une fenêtre propre, sans quitter la page.'
      },
      {
        type: 'feature',
        text: 'Module Pratique — gestion des catégories dans un modal séparé, accessible via le bouton "Gérer les catégories".'
      },
      {
        type: 'feature',
        text: 'Module Pratique — onglets de régions cliquables avec retour à la ligne automatique et compteur de vidéos par région. Suppression du mode défilement TikTok.'
      },
      {
        type: 'feature',
        text: 'Module Pratique — pagination (12 vidéos par page) pour les régions avec beaucoup de contenu.'
      },
      {
        type: 'feature',
        text: 'Module Pratique — nouvelle région "Bassin" ajoutée. Les régions "Pied" et "Cheville" fusionnées en "Pied & Cheville".'
      },
      {
        type: 'improvement',
        text: 'Module Pratique — ordre d\'affichage automatique : si le champ ordre est laissé vide, la vidéo est placée à la fin de sa région.'
      },
      {
        type: 'fix',
        text: 'Module Pratique — correction du bug qui chargeait toujours la première vidéo de la catégorie au lieu de celle cliquée.'
      },
      {
        type: 'fix',
        text: 'Sécurité — correction d\'une erreur 403 lors de l\'enregistrement de la progression vidéo (trigger gamification passé en SECURITY DEFINER).'
      },
      {
        type: 'fix',
        text: 'Sécurité — Content Security Policy mise à jour pour autoriser le widget de feedback Vercel Live.'
      }
    ]
  },
  {
    date: '28 février 2026',
    changes: [
      {
        type: 'feature',
        text: 'Page /parrainage — nouvelle page dédiée accessible à tous, avec contenu adapté au rôle : les membres Gold voient leur code, leurs gains et leur cagnotte ; les Silver reçoivent un teasing pour passer Gold ; les membres Free ont un CTA vers les offres'
      },
      {
        type: 'feature',
        text: 'Navigation — lien "Parrainage & Cagnotte" ajouté pour tous les utilisateurs connectés'
      },
      {
        type: 'feature',
        text: 'Admin — page /admin/promo : génération de codes promo Stripe -100€ sur l\'abonnement Gold (code personnalisable, nb d\'utilisations, barre de progression, désactivation). Accessible depuis le dashboard admin et la navigation'
      },
      {
        type: 'feature',
        text: 'Checkout Stripe — champ "code promo" désormais visible lors du paiement (allow_promotion_codes activé). Les codes générés depuis /admin/promo sont saisis directement par l\'utilisateur sur la page de paiement Stripe'
      },
      {
        type: 'improvement',
        text: 'Page abonnement — section parrainage enrichie : champ de code mieux expliqué pour les non-premium, section dédiée pour les Gold avec gains indicatifs et lien vers la cagnotte, section incitative pour les Silver leur expliquant l\'intérêt de passer Gold'
      }
    ]
  },
  {
    date: '28 février 2026',
    changes: [
      {
        type: 'feature',
        text: 'Footer partagé — présent sur toutes les pages (authentifiées et publiques) avec les liens vers les pages légales : Mentions légales, CGU/CGV, Politique de confidentialité'
      },
      {
        type: 'feature',
        text: 'Bandeau cookies (RGPD) — consentement demandé à la première visite, mémorisé en localStorage, avec lien vers la politique de confidentialité'
      },
      {
        type: 'feature',
        text: 'Liens légaux dans la navigation authentifiée — accessibles depuis la sidebar sous le bouton de déconnexion'
      },
      {
        type: 'improvement',
        text: 'CGU mises à jour — tarifs corrects (Silver 29€/mois ou 240€/an, Gold 499€/an), suppression de la mention d\'engagement 12 mois, ajout de la section Programme Ambassadeur Gold avec détail des commissions'
      },
      {
        type: 'improvement',
        text: 'Emails de la plateforme mis à jour — tarifs et conditions alignés avec les CGU (suppression de l\'engagement, tarifs corrects)'
      },
      {
        type: 'fix',
        text: 'Programme ambassadeur — clarification : les commissions sont versées par virement bancaire (pas un crédit plateforme), retrait possible dès 50€ cumulés'
      }
    ]
  },
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
