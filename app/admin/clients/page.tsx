'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AdminBackButton from '@/components/AdminBackButton'
import {
  Users, Search, Download, Mail, Loader2, ArrowUpDown, MessageSquareQuote,
  AlertTriangle, EyeOff, Star, ClipboardCheck, ListChecks,
} from 'lucide-react'
import { planLabel, planOf, PLANS } from '@/lib/entitlements'
import {
  LIFECYCLE_STAGES,
  URGENCE_STYLES,
  churnReasonLabel,
  lifecycleLabel,
  signalPrincipal,
  signauxDe,
  suggestedSurvey,
  type SurveyKind,
} from '@/lib/customer-tracking'
import FicheClient from './FicheClient'
import ComposeurEmail from './ComposeurEmail'
import ReponsesEnquetes from './ReponsesEnquetes'
import ConsignerAction from './ConsignerAction'
import AtraiterFile from './AtraiterFile'

type Tri =
  | 'created_at' | 'full_name' | 'lifecycle_stage' | 'plan'
  | 'last_login_date' | 'emails_sent' | 'last_email_at' | 'canceled_at'

const COLONNES: { cle: Tri; libelle: string }[] = [
  { cle: 'full_name', libelle: 'Client' },
  { cle: 'lifecycle_stage', libelle: 'Étape' },
  { cle: 'plan', libelle: 'Offre' },
  { cle: 'created_at', libelle: 'Inscrit' },
  { cle: 'last_login_date', libelle: 'Dernière visite' },
  { cle: 'emails_sent', libelle: 'Emails' },
  { cle: 'last_email_at', libelle: 'Dernière relance' },
]

function jour(v: string | null | undefined) {
  if (!v) return '-'
  return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

/** Nombre de jours écoulés, pour repérer d'un coup d'œil qui dort depuis longtemps. */
function joursDepuis(v: string | null | undefined): number | null {
  if (!v) return null
  return Math.floor((Date.now() - new Date(v).getTime()) / 86400000)
}

/**
 * Suivi des utilisateurs et clients (/admin/clients).
 *
 * Complète /admin/users, qui gère les comptes (rôle, offre, statut Fondateur)
 * mais ne dit rien de leur parcours. Ici on répond à quatre questions :
 * a-t-il pris l'essai, l'a-t-il annulé et pourquoi, quelle offre a-t-il prise,
 * et que lui a-t-on déjà écrit.
 *
 * Le jeu complet est chargé en une fois puis trié et filtré dans le
 * navigateur : à quelques centaines de comptes, c'est instantané et cela
 * permet de croiser librement les filtres sans rappel serveur.
 */
export default function SuiviClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [chargement, setChargement] = useState(true)
  const [vue, setVue] = useState<'a_traiter' | 'clients' | 'reponses'>('a_traiter')

  const [recherche, setRecherche] = useState('')
  const [filtreEtape, setFiltreEtape] = useState('all')
  const [filtreOffre, setFiltreOffre] = useState('all')
  const [filtreTag, setFiltreTag] = useState('all')
  const [filtreRapide, setFiltreRapide] = useState<'aucun' | 'jamais_relance' | 'jamais_ouvert' | 'inactif_30j' | 'sans_reponse'>('aucun')

  const [tri, setTri] = useState<Tri>('created_at')
  const [triDesc, setTriDesc] = useState(true)

  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [ficheId, setFicheId] = useState<string | null>(null)
  const [composeurGroupe, setComposeurGroupe] = useState(false)
  const [consignationGroupe, setConsignationGroupe] = useState(false)
  // Écriture lancée depuis la file d'attente, sur un seul compte : elle
  // court-circuite la sélection, qui n'a pas de sens dans ce contexte.
  const [cibleDirecte, setCibleDirecte] = useState<{ client: any; enquete: boolean } | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/')
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') return router.push('/dashboard')
      charger()
    }
    verifier()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const charger = async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/admin/customers')
      if (res.ok) {
        const json = await res.json()
        setClients(json.clients || [])
        setStats(json.stats || null)
      }
    } finally {
      setChargement(false)
    }
  }

  const nbATraiter = useMemo(
    () => clients.filter((c) => signauxDe(c).length > 0).length,
    [clients]
  )

  const tags = useMemo(() => {
    const set = new Set<string>()
    clients.forEach((c) => (c.admin_tags || []).forEach((t: string) => set.add(t)))
    return Array.from(set).sort()
  }, [clients])

  const filtres = useMemo(() => {
    let liste = [...clients]

    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase()
      liste = liste.filter(
        (c) =>
          c.email?.toLowerCase().includes(q) ||
          c.full_name?.toLowerCase().includes(q) ||
          (c.admin_tags || []).some((t: string) => t.includes(q))
      )
    }
    if (filtreEtape !== 'all') liste = liste.filter((c) => c.lifecycle_stage === filtreEtape)
    if (filtreOffre !== 'all') liste = liste.filter((c) => planOf(c) === filtreOffre)
    if (filtreTag !== 'all') liste = liste.filter((c) => (c.admin_tags || []).includes(filtreTag))

    // Filtres rapides : ce sont les listes de travail, celles sur lesquelles on
    // agit. « Jamais relancé » sert à ne pas oublier quelqu'un, « sans
    // réaction » à ne pas s'acharner sur une adresse qui ne répond à rien.
    //
    // Le clic compte autant que l'ouverture, et pas seulement par prudence :
    // le suivi d'ouverture de Resend demande un sous-domaine dédié et reste
    // facultatif. S'il est désactivé, `emails_opened` vaut zéro pour tout le
    // monde, et ce filtre désignerait comme silencieux quelqu'un qui vient de
    // cliquer sur le lien de la relance.
    //
    // `emails_tracked` et non `emails_sent` : un email consigné à la main
    // n'aura jamais de statut d'ouverture, rien ne pouvant être mesuré d'un
    // message parti d'ailleurs. Le compter ici ferait dire à la liste
    // « relancé, aucun signe de vie » là où la vérité est « nous n'en savons
    // rien », et c'est exactement le contresens qui fait renoncer à un compte.
    if (filtreRapide === 'jamais_relance') liste = liste.filter((c) => !c.emails_sent)
    if (filtreRapide === 'jamais_ouvert') {
      liste = liste.filter((c) => c.emails_tracked > 0 && !c.emails_opened && !c.emails_clicked)
    }
    if (filtreRapide === 'inactif_30j') {
      liste = liste.filter((c) => {
        const j = joursDepuis(c.last_login_date)
        return j === null || j >= 30
      })
    }
    if (filtreRapide === 'sans_reponse') liste = liste.filter((c) => (c.surveys_sent || 0) > (c.surveys_answered || 0))

    const valeur = (c: any) => {
      const v = c[tri]
      if (tri === 'plan') return planOf(c)
      if (tri === 'full_name') return (c.full_name || c.email || '').toLowerCase()
      if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v).getTime()
      return v ?? (typeof c[tri] === 'number' ? 0 : '')
    }

    liste.sort((a, b) => {
      const va = valeur(a)
      const vb = valeur(b)
      // Les valeurs manquantes vont toujours en fin de liste, quel que soit le
      // sens du tri : trier par « dernière relance » doit montrer les relances
      // récentes en tête, pas une colonne vide.
      if (va == null || va === '') return 1
      if (vb == null || vb === '') return -1
      if (va === vb) return 0
      return (va > vb ? 1 : -1) * (triDesc ? -1 : 1)
    })

    return liste
  }, [clients, recherche, filtreEtape, filtreOffre, filtreTag, filtreRapide, tri, triDesc])

  const basculerTri = (cle: Tri) => {
    if (tri === cle) setTriDesc(!triDesc)
    else {
      setTri(cle)
      setTriDesc(true)
    }
  }

  const basculerSelection = (id: string) => {
    const copie = new Set(selection)
    if (copie.has(id)) copie.delete(id)
    else copie.add(id)
    setSelection(copie)
  }

  const toutSelectionner = () => {
    if (selection.size === filtres.length) setSelection(new Set())
    else setSelection(new Set(filtres.map((c) => c.id)))
  }

  const selectionnes = filtres.filter((c) => selection.has(c.id))

  // Enquête proposée par défaut pour un envoi groupé : seulement quand toute
  // la sélection est au même stade. Proposer « pourquoi avez-vous résilié ? »
  // à une liste mélangée d'abonnés et de curieux ne produirait rien d'utile.
  const suggestionGroupe: SurveyKind | null = useMemo(() => {
    if (!selectionnes.length) return null
    const etapes = new Set(selectionnes.map((c) => c.lifecycle_stage))
    return etapes.size === 1 ? suggestedSurvey(Array.from(etapes)[0]) : null
  }, [selectionnes])

  const exporterCSV = () => {
    const entetes = [
      'Email', 'Nom', 'Étape', 'Offre', 'Inscrit le', 'Essai pris le', 'Abonné le',
      'Résilié le', 'Motif de départ', 'Commentaire', 'Dernière visite',
      'Emails envoyés', 'Emails ouverts', 'Dernière relance', 'Enquêtes répondues', 'Étiquettes',
    ]
    const echapper = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lignes = filtres.map((c) =>
      [
        c.email, c.full_name || '', lifecycleLabel(c.lifecycle_stage).label, planLabel(planOf(c)),
        jour(c.created_at), jour(c.trial_used_at), jour(c.first_subscribed_at), jour(c.canceled_at),
        churnReasonLabel(c.churn_reason) || '', c.churn_comment || '', jour(c.last_login_date),
        c.emails_sent || 0, c.emails_opened || 0, jour(c.last_email_at),
        `${c.surveys_answered || 0}/${c.surveys_sent || 0}`, (c.admin_tags || []).join(' '),
      ].map(echapper).join(',')
    )
    const blob = new Blob(['﻿' + [entetes.map(echapper).join(','), ...lignes].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `suivi-clients-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  if (chargement) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="min-h-screen -m-6 md:-m-8">

        {/* EN-TÊTE */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 px-6 md:px-10 pt-8 pb-6">
          <div className="absolute top-0 left-0 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4" />
          <div className="absolute top-1/2 right-0 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl" />
          <div className="relative">
            <AdminBackButton />
            <div className="bg-white/[0.09] backdrop-blur-xl border border-white/20 ring-1 ring-inset ring-white/15 rounded-3xl shadow-[0_12px_40px_rgba(0,8,30,0.65)] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-violet-300 text-sm font-medium mb-1 tracking-wide flex items-center gap-2">
                  <Users className="h-4 w-4" /> Administration
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-violet-100 to-purple-200 bg-clip-text text-transparent">
                  Suivi des clients
                </h1>
                <p className="text-violet-300/70 text-sm mt-1.5">
                  Parcours, relances et retours des {stats?.total ?? 0} comptes
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exporterCSV}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20"
                >
                  <Download className="h-4 w-4" /> Exporter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CORPS */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-100/80 via-slate-50 to-indigo-50/80 px-6 md:px-10 pt-8 pb-10">
          <div className="pointer-events-none absolute top-0 left-1/4 w-96 h-96 bg-violet-400/30 rounded-full blur-3xl" />
          <div className="relative space-y-6">

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setVue('a_traiter')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  vue === 'a_traiter' ? 'bg-violet-600 text-white border-violet-500 shadow' : 'bg-white/70 text-slate-700 border-violet-200/60'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4" /> À traiter
                  {nbATraiter > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold ${vue === 'a_traiter' ? 'bg-white/20' : 'bg-red-100 text-red-700'}`}>
                      {nbATraiter}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setVue('clients')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  vue === 'clients' ? 'bg-violet-600 text-white border-violet-500 shadow' : 'bg-white/70 text-slate-700 border-violet-200/60'
                }`}
              >
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Clients</span>
              </button>
              <button
                onClick={() => setVue('reponses')}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  vue === 'reponses' ? 'bg-violet-600 text-white border-violet-500 shadow' : 'bg-white/70 text-slate-700 border-violet-200/60'
                }`}
              >
                <span className="flex items-center gap-2"><MessageSquareQuote className="h-4 w-4" /> Réponses</span>
              </button>
            </div>

            {message && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between">
                {message}
                <button onClick={() => setMessage(null)} className="text-emerald-600 font-semibold">Fermer</button>
              </div>
            )}

            {vue === 'a_traiter' ? (
              <AtraiterFile
                clients={clients}
                onOuvrir={setFicheId}
                onEcrire={(c) => setCibleDirecte({ client: c, enquete: false })}
                onEnquete={(c) => setCibleDirecte({ client: c, enquete: true })}
              />
            ) : vue === 'reponses' ? (
              <ReponsesEnquetes />
            ) : (
              <>
                {/* INDICATEURS */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <Indicateur titre="À traiter" valeur={stats.aTraiter ?? 0} couleur="text-red-600" onClick={() => setVue('a_traiter')} />
                    <Indicateur titre="Comptes" valeur={stats.total} onClick={() => setFiltreEtape('all')} />
                    <Indicateur titre="Inscrits sans suite" valeur={stats.inscrits} onClick={() => setFiltreEtape('inscrit')} />
                    <Indicateur titre="Essai en cours" valeur={stats.essaiEnCours} couleur="text-blue-600" onClick={() => setFiltreEtape('essai_en_cours')} />
                    <Indicateur titre="Essai sans suite" valeur={stats.essaiTermine} couleur="text-amber-600" onClick={() => setFiltreEtape('essai_termine')} />
                    <Indicateur titre="Abonnés" valeur={stats.abonnes} couleur="text-emerald-600" onClick={() => setFiltreEtape('abonne')} />
                    <Indicateur titre="Résiliés" valeur={stats.resilies} couleur="text-red-600" onClick={() => setFiltreEtape('resilie')} />
                    <Indicateur titre="Essais convertis" valeur={`${stats.tauxConversionEssai} %`} couleur="text-violet-600" />
                    {stats.envoisEnEchec > 0 && (
                      <Indicateur titre="Envois en échec" valeur={stats.envoisEnEchec} couleur="text-red-600" />
                    )}
                  </div>
                )}

                {/* Motifs de départ agrégés */}
                {stats && Object.keys(stats.motifsResiliation || {}).length > 0 && (
                  <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Motifs de départ enregistrés
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.motifsResiliation as Record<string, number>)
                        .sort((a, b) => b[1] - a[1])
                        .map(([motif, n]) => (
                          <span key={motif} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-800 text-sm font-semibold">
                            {churnReasonLabel(motif)} <span className="opacity-60">{n}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* FILTRES */}
                <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl p-4 space-y-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        placeholder="Email, nom ou étiquette..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                      />
                    </div>
                    <select value={filtreEtape} onChange={(e) => setFiltreEtape(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                      <option value="all">Toutes les étapes</option>
                      {LIFECYCLE_STAGES.map((s) => (
                        <option key={s} value={s}>{lifecycleLabel(s).label}</option>
                      ))}
                    </select>
                    <select value={filtreOffre} onChange={(e) => setFiltreOffre(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                      <option value="all">Toutes les offres</option>
                      {PLANS.map((p) => (
                        <option key={p} value={p}>{planLabel(p)}</option>
                      ))}
                    </select>
                    {tags.length > 0 && (
                      <select value={filtreTag} onChange={(e) => setFiltreTag(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
                        <option value="all">Toutes les étiquettes</option>
                        {tags.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {([
                      ['aucun', 'Tous'],
                      ['jamais_relance', 'Jamais relancé'],
                      ['jamais_ouvert', 'Sans réaction'],
                      ['inactif_30j', 'Inactif 30 jours'],
                      ['sans_reponse', 'Enquête sans réponse'],
                    ] as const).map(([cle, libelle]) => (
                      <button
                        key={cle}
                        onClick={() => setFiltreRapide(cle)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          filtreRapide === cle
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                        }`}
                      >
                        {libelle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BARRE DE SÉLECTION */}
                {selection.size > 0 && (
                  <div className="sticky top-2 z-20 rounded-2xl bg-slate-900 text-white shadow-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{selection.size} compte(s) sélectionné(s)</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setComposeurGroupe(true)}
                        className="px-4 py-2 rounded-lg bg-violet-600 text-sm font-semibold hover:bg-violet-500 inline-flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" /> Écrire à la sélection
                      </button>
                      <button
                        onClick={() => setConsignationGroupe(true)}
                        className="px-4 py-2 rounded-lg bg-white/10 text-sm font-semibold hover:bg-white/20 inline-flex items-center gap-2"
                      >
                        <ClipboardCheck className="h-4 w-4" /> Consigner
                      </button>
                      <button onClick={() => setSelection(new Set())} className="px-4 py-2 rounded-lg bg-white/10 text-sm font-semibold hover:bg-white/20">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* TABLEAU */}
                <div className="rounded-2xl bg-white/90 backdrop-blur-2xl border border-white/70 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={filtres.length > 0 && selection.size === filtres.length}
                              onChange={toutSelectionner}
                              className="rounded border-slate-300"
                            />
                          </th>
                          {COLONNES.map((c) => (
                            <th key={c.cle} className="px-4 py-3 text-left">
                              <button
                                onClick={() => basculerTri(c.cle)}
                                className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide ${
                                  tri === c.cle ? 'text-violet-700' : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                {c.libelle}
                                <ArrowUpDown className="h-3 w-3" />
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtres.map((c) => {
                          const etape = lifecycleLabel(c.lifecycle_stage)
                          const inactif = joursDepuis(c.last_login_date)
                          const signal = signalPrincipal(c)
                          return (
                            <tr key={c.id} className="hover:bg-violet-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selection.has(c.id)}
                                  onChange={() => basculerSelection(c.id)}
                                  className="rounded border-slate-300"
                                />
                              </td>
                              <td className="px-4 py-3 cursor-pointer" onClick={() => setFicheId(c.id)}>
                                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  {signal && (
                                    <span
                                      className={`h-2 w-2 rounded-full shrink-0 ${URGENCE_STYLES[signal.urgence].point}`}
                                      title={signal.raison}
                                    />
                                  )}
                                  {c.full_name || '(sans nom)'}
                                  {c.is_founding_member && <Star className="h-3.5 w-3.5 text-yellow-500" />}
                                  {c.emails_tracked > 0 && !c.emails_opened && !c.emails_clicked && (
                                    <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                                  )}
                                </p>
                                <p className="text-xs text-slate-400">{c.email}</p>
                                {(c.admin_tags || []).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {c.admin_tags.map((t: string) => (
                                      <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 cursor-pointer" onClick={() => setFicheId(c.id)}>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${etape.classes}`}>
                                  {etape.label}
                                </span>
                                {c.churn_reason && (
                                  <p className="text-[11px] text-red-500 mt-1">{churnReasonLabel(c.churn_reason)}</p>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-600 cursor-pointer" onClick={() => setFicheId(c.id)}>
                                {planLabel(planOf(c))}
                              </td>
                              <td className="px-4 py-3 text-slate-500 cursor-pointer" onClick={() => setFicheId(c.id)}>
                                {jour(c.created_at)}
                              </td>
                              <td className="px-4 py-3 cursor-pointer" onClick={() => setFicheId(c.id)}>
                                <span className={inactif !== null && inactif >= 30 ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                                  {inactif === null ? 'Jamais' : inactif === 0 ? "Aujourd'hui" : `Il y a ${inactif} j`}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 cursor-pointer" onClick={() => setFicheId(c.id)}>
                                {c.emails_sent || 0}
                                {c.emails_opened ? (
                                  <span className="text-emerald-600 font-semibold"> · {c.emails_opened} lu(s)</span>
                                ) : null}
                                {c.emails_clicked ? (
                                  <span className="text-violet-600 font-semibold"> · {c.emails_clicked} clic(s)</span>
                                ) : null}
                              </td>
                              <td className="px-4 py-3 text-slate-500 cursor-pointer" onClick={() => setFicheId(c.id)}>
                                {jour(c.last_email_at)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {filtres.length === 0 && (
                    <p className="text-center text-slate-400 py-12 text-sm">Aucun compte ne correspond à ces filtres.</p>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  {filtres.length} compte(s) affiché(s) sur {clients.length}.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {ficheId && (
        <FicheClient clientId={ficheId} onClose={() => setFicheId(null)} onChange={charger} />
      )}

      {cibleDirecte && (
        <ComposeurEmail
          destinataires={[
            {
              id: cibleDirecte.client.id,
              email: cibleDirecte.client.email,
              full_name: cibleDirecte.client.full_name,
            },
          ]}
          suggestion={
            cibleDirecte.enquete ? suggestedSurvey(cibleDirecte.client.lifecycle_stage) : null
          }
          onClose={() => setCibleDirecte(null)}
          onSent={(resume) => {
            setCibleDirecte(null)
            setMessage(resume)
            charger()
          }}
        />
      )}

      {consignationGroupe && selectionnes.length > 0 && (
        <ConsignerAction
          cibles={selectionnes.map((c) => ({ id: c.id, email: c.email, full_name: c.full_name }))}
          motifDepartPossible={selectionnes.every((c) =>
            ['resilie', 'essai_termine'].includes(c.lifecycle_stage)
          )}
          onClose={() => setConsignationGroupe(false)}
          onDone={(resume) => {
            setConsignationGroupe(false)
            setSelection(new Set())
            setMessage(resume)
            charger()
          }}
        />
      )}

      {composeurGroupe && selectionnes.length > 0 && (
        <ComposeurEmail
          destinataires={selectionnes.map((c) => ({ id: c.id, email: c.email, full_name: c.full_name }))}
          suggestion={suggestionGroupe}
          onClose={() => setComposeurGroupe(false)}
          onSent={(resume) => {
            setComposeurGroupe(false)
            setSelection(new Set())
            setMessage(resume)
            charger()
          }}
        />
      )}
    </AuthLayout>
  )
}

function Indicateur({
  titre, valeur, couleur, onClick,
}: {
  titre: string
  valeur: number | string
  couleur?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-lg p-4 text-left disabled:cursor-default hover:shadow-xl transition-shadow"
    >
      <p className="text-xs text-slate-500 mb-1">{titre}</p>
      <p className={`text-2xl font-bold ${couleur || 'text-slate-800'}`}>{valeur}</p>
    </button>
  )
}
