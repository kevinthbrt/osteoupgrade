'use client'

import { useEffect, useState } from 'react'
import {
  X, Loader2, Mail, StickyNote, Clock, LifeBuoy, Inbox, Tag, Trash2,
  ExternalLink, Star, CreditCard, Gift, Pin, ClipboardCheck,
} from 'lucide-react'
import { planLabel, planOf } from '@/lib/entitlements'
import {
  CANAL_LABELS,
  EMAIL_STATUS_LABELS,
  EVENT_LABELS,
  SURVEY_DEFINITIONS,
  churnReasonLabel,
  lifecycleLabel,
  suggestedSurvey,
  type CanalContact,
  type CustomerEventType,
  type SurveyKind,
} from '@/lib/customer-tracking'
import ComposeurEmail from './ComposeurEmail'
import ConsignerAction from './ConsignerAction'

function dateCourte(v: string | null | undefined) {
  if (!v) return null
  return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function dateHeure(v: string | null | undefined) {
  if (!v) return null
  return new Date(v).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

type Onglet = 'chronologie' | 'emails' | 'notes' | 'enquetes'

/**
 * Fiche d'un compte : tout ce qui le concerne au même endroit.
 *
 * Les données viennent d'un seul appel (`/api/admin/customers/[id]`) plutôt
 * que d'une requête par onglet : la fiche s'ouvre déjà remplie, et l'admin
 * qui traite vingt comptes à la suite n'attend pas à chaque clic d'onglet.
 */
export default function FicheClient({
  clientId,
  onClose,
  onChange,
}: {
  clientId: string
  onClose: () => void
  onChange: () => void
}) {
  const [data, setData] = useState<any>(null)
  const [chargement, setChargement] = useState(true)
  const [onglet, setOnglet] = useState<Onglet>('chronologie')
  const [note, setNote] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [composeur, setComposeur] = useState(false)
  const [consignation, setConsignation] = useState(false)
  const [nouvelleTag, setNouvelleTag] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const charger = async () => {
    setChargement(true)
    try {
      const res = await fetch(`/api/admin/customers/${clientId}`)
      if (res.ok) setData(await res.json())
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId])

  const client = data?.client

  const ajouterNote = async () => {
    if (!note.trim()) return
    setEnregistrement(true)
    try {
      const res = await fetch(`/api/admin/customers/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: note }),
      })
      if (res.ok) {
        setNote('')
        await charger()
        onChange()
      }
    } finally {
      setEnregistrement(false)
    }
  }

  const supprimerNote = async (noteId: string) => {
    await fetch(`/api/admin/customers/${clientId}/notes?noteId=${noteId}`, { method: 'DELETE' })
    await charger()
    onChange()
  }

  const supprimerConsignation = async (eventId: string) => {
    const res = await fetch(`/api/admin/customers/interactions?eventId=${eventId}`, { method: 'DELETE' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setMessage(json.error || 'Suppression impossible.')
      return
    }
    await charger()
    onChange()
  }

  const majTags = async (tags: string[]) => {
    const res = await fetch(`/api/admin/customers/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_tags: tags }),
    })
    if (res.ok) {
      await charger()
      onChange()
    }
  }

  if (chargement || !client) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  const etape = lifecycleLabel(client.lifecycle_stage)
  const tags: string[] = client.admin_tags || []
  const enquetesRepondues = (data.enquetes || []).filter((e: any) => e.responded_at)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end" onClick={onClose}>
        <div
          className="w-full max-w-3xl h-full bg-slate-50 shadow-2xl overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white truncate">
                  {client.full_name || client.email}
                </h2>
                <p className="text-violet-200/80 text-sm truncate">{client.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${etape.classes}`}>
                    {etape.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white">
                    {planLabel(planOf(client))}
                  </span>
                  {client.is_founding_member && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-400/20 text-yellow-200 inline-flex items-center gap-1">
                      <Star className="h-3 w-3" /> Fondateur
                    </span>
                  )}
                  {client.partner_discount_name && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-400/20 text-cyan-100">
                      {client.partner_discount_name}
                    </span>
                  )}
                  {!client.newsletter_opt_in && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-400/20 text-red-200">
                      Newsletter refusée
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setComposeur(true)}
                className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 inline-flex items-center gap-2"
              >
                <Mail className="h-4 w-4" /> Écrire
              </button>
              <button
                onClick={() => setConsignation(true)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 inline-flex items-center gap-2"
              >
                <ClipboardCheck className="h-4 w-4" /> Consigner
              </button>
              {client.stripe_customer_id && (
                <a
                  href={`https://dashboard.stripe.com/customers/${client.stripe_customer_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 inline-flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" /> Stripe <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {message && (
            <div className="mx-6 mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800">
              {message}
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Synthèse */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Carte titre="Inscrit le" valeur={dateCourte(client.created_at) || '-'} />
              <Carte
                titre="Essai gratuit"
                valeur={client.has_trialed ? dateCourte(client.trial_used_at) || 'Oui' : 'Jamais pris'}
                accent={client.has_trialed ? 'text-blue-700' : 'text-slate-400'}
              />
              <Carte
                titre="Abonné depuis"
                valeur={dateCourte(client.first_subscribed_at) || dateCourte(client.subscription_start_date) || 'Jamais'}
              />
              <Carte
                titre={client.canceled_at ? 'Résilié le' : client.trial_canceled_at ? 'Essai annulé le' : 'Résilié le'}
                valeur={
                  dateCourte(client.canceled_at) ||
                  dateCourte(client.trial_canceled_at) ||
                  dateCourte(client.subscription_end_date) ||
                  '-'
                }
                accent={client.canceled_at || client.trial_canceled_at ? 'text-red-600' : undefined}
              />
              <Carte
                titre="Site OsteoUpgrade"
                valeur={dateCourte(client.last_login_date) || 'Jamais ouvert'}
                accent={client.last_login_date ? undefined : 'text-slate-400'}
              />
              <Carte
                titre="Logiciel MyOsteoFlow"
                valeur={
                  client.osteoflow_last_active_at
                    ? `${dateCourte(client.osteoflow_last_active_at)}${client.osteoflow_devices > 1 ? ` · ${client.osteoflow_devices} postes` : ''}`
                    : 'Jamais lancé'
                }
                accent={client.osteoflow_last_active_at ? undefined : 'text-slate-400'}
              />
              <Carte
                titre="Emails envoyés"
                valeur={
                  client.emails_failed
                    ? `${client.emails_sent || 0} · ${client.emails_failed} en échec`
                    : String(client.emails_sent || 0)
                }
                accent={client.emails_failed ? 'text-red-600' : undefined}
              />
              <Carte
                titre="Ouverts"
                valeur={`${client.emails_opened || 0}${client.emails_clicked ? ` · ${client.emails_clicked} clic(s)` : ''}`}
                accent={client.emails_tracked && !client.emails_opened && !client.emails_clicked ? 'text-amber-600' : undefined}
              />
              <Carte
                titre="Enquêtes"
                valeur={`${client.surveys_answered || 0}/${client.surveys_sent || 0} répondues`}
              />
            </div>

            {/* Motif de départ */}
            {(client.churn_reason || client.churn_comment) && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
                  Motif de départ
                </p>
                <p className="text-sm text-red-900 font-semibold">
                  {churnReasonLabel(client.churn_reason) || 'Non renseigné'}
                </p>
                {client.churn_comment && (
                  <p className="text-sm text-red-800/80 mt-1 italic">« {client.churn_comment} »</p>
                )}
                {(data.evenements || []).some((e: any) => e.metadata?.motif_manuel) && (
                  <p className="text-[11px] text-red-600/70 mt-2">
                    Motif ressaisi à la main, et non recueilli auprès du client par Stripe.
                  </p>
                )}
              </div>
            )}

            {/* Dernière réponse d'enquête */}
            {enquetesRepondues.length > 0 && (
              <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-1">
                  Dernière réponse
                </p>
                <p className="text-sm text-violet-900 font-semibold">{enquetesRepondues[0].question}</p>
                {enquetesRepondues[0].choice && (
                  <p className="text-sm text-violet-800 mt-1">{enquetesRepondues[0].choice}</p>
                )}
                {enquetesRepondues[0].rating && (
                  <p className="text-sm text-violet-800 mt-1">Note : {enquetesRepondues[0].rating}/5</p>
                )}
                {enquetesRepondues[0].answer && (
                  <p className="text-sm text-violet-800/80 mt-1 italic">« {enquetesRepondues[0].answer} »</p>
                )}
              </div>
            )}

            {/* Étiquettes */}
            <div className="rounded-xl bg-white border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Étiquettes
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 inline-flex items-center gap-1.5"
                  >
                    {t}
                    <button onClick={() => majTags(tags.filter((x) => x !== t))} className="hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={nouvelleTag}
                  onChange={(e) => setNouvelleTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nouvelleTag.trim()) {
                      majTags([...tags, nouvelleTag.trim()])
                      setNouvelleTag('')
                    }
                  }}
                  placeholder="Ajouter puis Entrée"
                  className="px-3 py-1 rounded-full border border-dashed border-slate-300 text-xs w-44 focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>

            {/* Onglets */}
            <div className="flex gap-1.5 flex-wrap">
              {([
                ['chronologie', 'Chronologie', data.evenements.length],
                ['emails', 'Emails', data.emails.length],
                ['notes', 'Notes', data.notes.length],
                ['enquetes', 'Enquêtes', data.enquetes.length],
              ] as [Onglet, string, number][]).map(([cle, libelle, n]) => (
                <button
                  key={cle}
                  onClick={() => setOnglet(cle)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    onglet === cle ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {libelle} <span className="opacity-60">{n}</span>
                </button>
              ))}
            </div>

            {onglet === 'chronologie' && (
              <div className="space-y-2">
                {data.evenements.length === 0 && <Vide texte="Aucun événement." />}
                {data.evenements.map((e: any) => (
                  <div key={e.id} className="rounded-xl bg-white border border-slate-200 p-3.5 flex gap-3">
                    {e.metadata?.manuel ? (
                      <ClipboardCheck className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {e.metadata?.canal && CANAL_LABELS[e.metadata.canal as CanalContact]
                            ? CANAL_LABELS[e.metadata.canal as CanalContact].label
                            : EVENT_LABELS[e.event_type as CustomerEventType] || e.event_type}
                          {e.metadata?.objet ? ` : ${e.metadata.objet}` : ''}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <p className="text-xs text-slate-400">{dateHeure(e.occurred_at)}</p>
                          {e.metadata?.manuel && (
                            <button
                              onClick={() => supprimerConsignation(e.id)}
                              title="Retirer cette entrée consignée"
                              className="text-slate-300 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      {e.metadata?.manuel && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Consigné à la main</p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
                        {e.previous_plan && e.plan && e.previous_plan !== e.plan
                          ? `${planLabel(e.previous_plan)} vers ${planLabel(e.plan)}`
                          : e.plan
                          ? planLabel(e.plan)
                          : null}
                        {e.amount_cents ? ` · ${(e.amount_cents / 100).toFixed(2).replace('.', ',')} €` : ''}
                        {e.source === 'backfill' ? ' · reconstitué' : ''}
                      </p>
                      {(e.reason || e.comment) && (
                        <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 rounded px-2 py-1.5">
                          {churnReasonLabel(e.reason)}
                          {e.reason && e.comment ? ' : ' : ''}
                          {e.comment ? `« ${e.comment} »` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {onglet === 'emails' && (
              <div className="space-y-2">
                {data.emails.length === 0 && <Vide texte="Aucun email envoyé depuis cette fiche." />}
                {data.emails.map((e: any) => {
                  const statut =
                    e.provider === 'manuel'
                      ? { label: 'Consigné', classes: 'bg-slate-100 text-slate-500' }
                      : EMAIL_STATUS_LABELS[e.status] || {
                          label: e.status,
                          classes: 'bg-slate-100 text-slate-600',
                        }
                  return (
                    <div key={e.id} className="rounded-xl bg-white border border-slate-200 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">{e.subject}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${statut.classes}`}>
                          {statut.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {dateHeure(e.sent_at)}
                        {e.open_count ? ` · ${e.open_count} ouverture(s)` : ''}
                        {e.click_count ? ` · ${e.click_count} clic(s)` : ''}
                      </p>
                      {e.error && <p className="text-xs text-red-600 mt-1">{e.error}</p>}
                    </div>
                  )
                })}

                {(data.emailsRecus.length > 0 || data.tickets.length > 0) && (
                  <div className="pt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reçu de sa part</p>
                    {data.emailsRecus.map((e: any) => (
                      <div key={e.id} className="rounded-xl bg-white border border-slate-200 p-3 flex gap-2.5">
                        <Inbox className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800 truncate">{e.subject || '(sans sujet)'}</p>
                          <p className="text-xs text-slate-400">{dateHeure(e.received_at)}</p>
                        </div>
                      </div>
                    ))}
                    {data.tickets.map((t: any) => (
                      <div key={t.id} className="rounded-xl bg-white border border-slate-200 p-3 flex gap-2.5">
                        <LifeBuoy className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800 truncate">{t.title}</p>
                          <p className="text-xs text-slate-400">
                            {t.status} · {dateHeure(t.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {onglet === 'notes' && (
              <div className="space-y-3">
                <div className="rounded-xl bg-white border border-slate-200 p-3.5">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Appelé le 12/03, veut une démo avant de s'abonner..."
                    className="w-full text-sm border-0 focus:outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={ajouterNote}
                      disabled={enregistrement || !note.trim()}
                      className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-40"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
                {data.notes.length === 0 && <Vide texte="Aucune note." />}
                {data.notes.map((n: any) => (
                  <div key={n.id} className="rounded-xl bg-white border border-slate-200 p-3.5 flex gap-3">
                    {n.pinned ? (
                      <Pin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <StickyNote className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
                      <p className="text-xs text-slate-400 mt-1">{dateHeure(n.created_at)}</p>
                    </div>
                    <button onClick={() => supprimerNote(n.id)} className="text-slate-300 hover:text-red-600 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {onglet === 'enquetes' && (
              <div className="space-y-2">
                {data.enquetes.length === 0 && <Vide texte="Aucune enquête envoyée." />}
                {data.enquetes.map((s: any) => (
                  <div key={s.id} className="rounded-xl bg-white border border-slate-200 p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {SURVEY_DEFINITIONS[s.kind as SurveyKind]?.label || s.kind}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                          s.responded_at ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {s.responded_at ? 'Répondu' : 'En attente'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{s.question}</p>
                    {s.choice && <p className="text-sm text-slate-800 mt-2">{s.choice}</p>}
                    {s.rating && <p className="text-sm text-slate-800 mt-1">Note : {s.rating}/5</p>}
                    {s.answer && <p className="text-sm text-slate-700 mt-1 italic">« {s.answer} »</p>}
                    <p className="text-xs text-slate-400 mt-2">
                      Envoyée {dateHeure(s.sent_at)}
                      {s.responded_at ? ` · répondue ${dateHeure(s.responded_at)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {data.parrainages.length > 0 && (
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5" /> Parrainages ({data.parrainages.length})
                </p>
                {data.parrainages.map((p: any) => (
                  <p key={p.id} className="text-sm text-slate-600">
                    {dateCourte(p.created_at)} · {p.subscription_plan || '-'} · {p.commission_status}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {consignation && (
        <ConsignerAction
          cibles={[{ id: client.id, email: client.email, full_name: client.full_name }]}
          motifDepartPossible={['resilie', 'essai_termine'].includes(client.lifecycle_stage)}
          onClose={() => setConsignation(false)}
          onDone={(resume) => {
            setConsignation(false)
            setMessage(resume)
            charger()
            onChange()
          }}
        />
      )}

      {composeur && (
        <ComposeurEmail
          destinataires={[{ id: client.id, email: client.email, full_name: client.full_name }]}
          suggestion={suggestedSurvey(client.lifecycle_stage)}
          onClose={() => setComposeur(false)}
          onSent={(resume) => {
            setComposeur(false)
            setMessage(resume)
            charger()
            onChange()
          }}
        />
      )}
    </>
  )
}

function Carte({ titre, valeur, accent }: { titre: string; valeur: string; accent?: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-3.5">
      <p className="text-xs text-slate-400">{titre}</p>
      <p className={`text-sm font-bold mt-0.5 ${accent || 'text-slate-800'}`}>{valeur}</p>
    </div>
  )
}

function Vide({ texte }: { texte: string }) {
  return <p className="text-sm text-slate-400 text-center py-8">{texte}</p>
}
