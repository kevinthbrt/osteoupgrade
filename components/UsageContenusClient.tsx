'use client'

import { useEffect, useState } from 'react'
import { Loader2, GraduationCap, HelpCircle, Video, Layers, Stethoscope, Award, Flame, CheckCircle2, XCircle } from 'lucide-react'

/**
 * Usage des contenus d’un client, à insérer partout où l’on regarde une
 * personne en particulier : la fiche client du CRM et le panneau de la page
 * `/admin/contenus`. Le composant va chercher ses données lui-même pour que
 * les deux appelants n’aient qu’un identifiant à passer.
 */

type Famille = { cle: string; label: string; actions30: number; actionsTotal: number; derniereActivite: string | null }
type Chapitre = { id: string; titre: string; sousParties: number; validees: number }
type Formation = {
  id: string; titre: string; gratuite: boolean; sousParties: number; validees: number
  avancement: number; derniereActivite: string | null; certificat: string | null; chapitres: Chapitre[]
}
type Quiz = { id: string; titre: string; formation: string | null; tentatives: number; meilleurScore: number | null; reussi: boolean; derniereActivite: string | null }
type Paquet = { id: string; titre: string; cartes: number; travaillees: number; revisions: number; noteMoyenne: number | null; oubliees: number; certificat: string | null; derniereActivite: string | null }

type Usage = {
  client: { id: string; nom: string | null; email: string | null; role: string | null; plan: string | null }
  gamification: { niveau: number | null; xp: number | null; streak: number | null; meilleurStreak: number | null; dernierLogin: string | null; connexions: number | null } | null
  synthese: { actions30: number; actionsTotal: number; derniereActivite: string | null; familles: Famille[] }
  formations: Formation[]
  quiz: Quiz[]
  pratique: { vues: number; videosDistinctes: number; parCategorie: { nom: string; vues: number }[]; dernieres: { titre: string; categorie: string | null; region: string | null; vueLe: string | null }[] }
  flashcards: { paquets: Paquet[]; revisions: number; cartesTravaillees: number }
  tests: { vues: { titre: string; vueLe: string | null }[]; total: number }
  timeline: { date: string; elearning: number; quiz: number; pratique: number; tests: number; flashcards: number }[]
}

const COULEURS: Record<string, string> = {
  elearning: '#6366f1',
  quiz: '#a855f7',
  pratique: '#0ea5e9',
  tests: '#f59e0b',
  flashcards: '#10b981',
}

function dateCourte(v: string | null | undefined) {
  if (!v) return 'jamais'
  return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function Bloc({ titre, icone: Icone, badge, children }: {
  titre: string
  icone: React.ComponentType<{ className?: string }>
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <Icone className="h-3.5 w-3.5" /> {titre}
        </p>
        {badge && <span className="text-[11px] text-slate-400">{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function Jauge({ valeur, couleur = 'bg-indigo-500' }: { valeur: number; couleur?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
      <div className={`h-full rounded-full ${couleur}`} style={{ width: `${Math.min(Math.max(valeur, 0), 100)}%` }} />
    </div>
  )
}

/** Chronologie compacte : une colonne par jour, empilée par rubrique. */
function MiniChrono({ data }: { data: Usage['timeline'] }) {
  const cles: (keyof Usage['timeline'][number])[] = ['elearning', 'quiz', 'pratique', 'tests', 'flashcards']
  const totaux = data.map(d => cles.reduce((s, k) => s + (d[k] as number), 0))
  const max = Math.max(...totaux, 1)
  if (totaux.every(t => t === 0)) {
    return <p className="text-xs text-slate-400">Aucune action sur les 90 derniers jours.</p>
  }
  return (
    <div className="flex items-end gap-[2px] h-16">
      {data.map((d, i) => {
        const total = totaux[i]
        return (
          <div key={d.date} className="flex-1 flex flex-col justify-end" title={`${new Date(d.date + 'T00:00:00').toLocaleDateString('fr-FR')} : ${total} action${total > 1 ? 's' : ''}`}>
            {cles.map(k => {
              const v = d[k] as number
              if (v <= 0) return null
              return <div key={String(k)} style={{ height: `${(v / max) * 100}%`, background: COULEURS[String(k)], minHeight: 2 }} />
            })}
          </div>
        )
      })}
    </div>
  )
}

export default function UsageContenusClient({ userId }: { userId: string }) {
  const [usage, setUsage] = useState<Usage | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    let annule = false
    const charger = async () => {
      setChargement(true)
      setErreur(null)
      try {
        const res = await fetch(`/api/admin/content-usage/${userId}`)
        if (!res.ok) throw new Error('Usage indisponible')
        const data = await res.json()
        if (!annule) setUsage(data)
      } catch (e: any) {
        if (!annule) setErreur(e.message || 'Erreur')
      } finally {
        if (!annule) setChargement(false)
      }
    }
    charger()
    return () => { annule = true }
  }, [userId])

  if (chargement) {
    return (
      <div className="py-10 text-center text-slate-400 text-sm">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        Lecture de l’usage des contenus…
      </div>
    )
  }
  if (erreur) return <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">{erreur}</div>
  if (!usage) return null

  const commencees = usage.formations.filter(f => f.validees > 0)
  const jamaisOuvertes = usage.formations.filter(f => f.validees === 0)

  return (
    <div className="space-y-4">

      {/* Synthèse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">Dernière action</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">{dateCourte(usage.synthese.derniereActivite)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">Actions (30 j)</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {usage.synthese.actions30} <span className="font-normal text-slate-400">sur {usage.synthese.actionsTotal} au total</span>
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide">Cours commencés</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {commencees.length} <span className="font-normal text-slate-400">sur {usage.formations.length}</span>
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Flame className="h-3 w-3" /> Gamification
          </p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {usage.gamification
              ? `Niveau ${usage.gamification.niveau ?? 1} · ${usage.gamification.streak ?? 0} j`
              : 'Aucune donnée'}
          </p>
        </div>
      </div>

      {/* Rubriques */}
      <Bloc titre="Ce qu’il utilise" icone={Layers} badge="30 derniers jours / total">
        <div className="space-y-2">
          {usage.synthese.familles.map(f => {
            const max = Math.max(...usage.synthese.familles.map(x => x.actionsTotal), 1)
            return (
              <div key={f.cle} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-slate-600 truncate">{f.label}</span>
                <div className="flex-1 h-5 rounded-md bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-md" style={{ width: `${(f.actionsTotal / max) * 100}%`, background: COULEURS[f.cle], minWidth: f.actionsTotal > 0 ? 4 : 0 }} />
                </div>
                <span className="w-28 shrink-0 text-right text-xs text-slate-600 tabular-nums">
                  <span className="font-semibold">{f.actions30}</span>
                  <span className="text-slate-400"> / {f.actionsTotal}</span>
                </span>
              </div>
            )
          })}
        </div>
        <div className="mt-4">
          <p className="text-[11px] text-slate-400 mb-1.5">Activité sur 90 jours</p>
          <MiniChrono data={usage.timeline} />
        </div>
      </Bloc>

      {/* Avancement des cours */}
      <Bloc titre="Avancement des cours" icone={GraduationCap} badge={`${commencees.length} commencé${commencees.length > 1 ? 's' : ''}`}>
        {commencees.length === 0 ? (
          <p className="text-sm text-slate-400">Ce client n’a validé aucune sous-partie de cours.</p>
        ) : (
          <div className="space-y-3">
            {commencees.map(f => (
              <div key={f.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {f.titre}
                    {f.certificat && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <Award className="h-3 w-3" /> certificat
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-slate-500 shrink-0 tabular-nums">{f.validees}/{f.sousParties}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Jauge valeur={f.avancement} />
                  <span className="text-xs font-semibold text-slate-600 w-9 text-right tabular-nums">{f.avancement}%</span>
                </div>
                {/* Chaque pastille est un chapitre : on voit d’un coup d'œil où il s’est arrêté. */}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {f.chapitres.map(c => (
                    <span
                      key={c.id}
                      title={`${c.titre} : ${c.validees}/${c.sousParties}`}
                      className={`h-1.5 w-6 rounded-full ${
                        c.sousParties === 0 ? 'bg-slate-100'
                          : c.validees === 0 ? 'bg-slate-200'
                          : c.validees >= c.sousParties ? 'bg-emerald-500'
                          : 'bg-indigo-400'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Dernière validation {dateCourte(f.derniereActivite)}</p>
              </div>
            ))}
          </div>
        )}
        {jamaisOuvertes.length > 0 && (
          <p className="text-[11px] text-slate-400 mt-3">
            Jamais ouvert : {jamaisOuvertes.map(f => f.titre).join(', ')}
          </p>
        )}
      </Bloc>

      {/* Quiz */}
      {usage.quiz.length > 0 && (
        <Bloc titre="Quiz" icone={HelpCircle} badge={`${usage.quiz.length} quiz tentés`}>
          <div className="space-y-1.5">
            {usage.quiz.map(q => (
              <div key={q.id} className="flex items-center gap-2 text-sm">
                {q.reussi
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  : <XCircle className="h-4 w-4 text-red-400 shrink-0" />}
                <span className="flex-1 min-w-0 truncate text-slate-700">{q.titre}</span>
                <span className="text-xs text-slate-500 shrink-0 tabular-nums">
                  {q.meilleurScore !== null ? `${q.meilleurScore}%` : '?'} · {q.tentatives} essai{q.tentatives > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </Bloc>
      )}

      {/* Vidéos de pratique */}
      <Bloc titre="Vidéos de pratique" icone={Video} badge={`${usage.pratique.videosDistinctes} vidéos · ${usage.pratique.vues} visionnages`}>
        {usage.pratique.vues === 0 ? (
          <p className="text-sm text-slate-400">Aucune vidéo ouverte.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {usage.pratique.parCategorie.map(c => (
                <span key={c.nom} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                  {c.nom} · {c.vues}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mb-1.5">Dernières vidéos ouvertes</p>
            <ul className="space-y-1 text-xs text-slate-600">
              {usage.pratique.dernieres.map((v, i) => (
                <li key={i} className="flex items-center justify-between gap-3">
                  <span className="truncate">{v.titre}</span>
                  <span className="text-slate-400 shrink-0">{dateCourte(v.vueLe)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Bloc>

      {/* Flashcards */}
      {usage.flashcards.paquets.length > 0 && (
        <Bloc titre="Flashcards" icone={Layers} badge={`${usage.flashcards.revisions} révisions`}>
          <div className="space-y-3">
            {usage.flashcards.paquets.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {p.titre}
                    {p.certificat && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <Award className="h-3 w-3" /> certificat
                      </span>
                    )}
                  </p>
                  <span className="text-xs text-slate-500 shrink-0 tabular-nums">{p.travaillees}/{p.cartes}</span>
                </div>
                <div className="mt-1.5">
                  <Jauge valeur={p.cartes > 0 ? (p.travaillees / p.cartes) * 100 : 0} couleur="bg-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {p.revisions} révisions · note moyenne {p.noteMoyenne ?? '?'}/4 · {p.oubliees} oubli{p.oubliees > 1 ? 's' : ''} · dernière {dateCourte(p.derniereActivite)}
                </p>
              </div>
            ))}
          </div>
        </Bloc>
      )}

      {/* Tests orthopédiques */}
      {usage.tests.total > 0 && (
        <Bloc titre="Tests orthopédiques" icone={Stethoscope} badge={`${usage.tests.total} consultations`}>
          <ul className="space-y-1 text-xs text-slate-600">
            {usage.tests.vues.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span className="truncate">{t.titre}</span>
                <span className="text-slate-400 shrink-0">{dateCourte(t.vueLe)}</span>
              </li>
            ))}
          </ul>
        </Bloc>
      )}
    </div>
  )
}
