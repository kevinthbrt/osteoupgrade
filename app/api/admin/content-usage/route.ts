import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@/lib/supabase-server-helpers'
import { supabaseAdmin } from '@/lib/supabase-server'

/**
 * Usage des contenus : qui consomme quoi, et surtout qu’est-ce qui ne sert pas.
 *
 * `/admin/stats` répond « combien de comptes, combien d’actions ». Cette route
 * répond à la question suivante : quelle formation, quelle vidéo, quel quiz
 * exactement. Les compteurs globaux ne disent jamais qu’une vidéo sur cinq n’a
 * jamais été ouverte.
 *
 * Par défaut les comptes administrateurs sont exclus : sur une base de cette
 * taille, les allers-retours de test fausseraient chaque classement. Le
 * paramètre `?admins=inclus` rend la mesure brute.
 */

export const dynamic = 'force-dynamic'

const MS_DAY = 24 * 60 * 60 * 1000
const FENETRE_JOURS = 90

// PostgREST plafonne une lecture à 1000 lignes : les tables de progression
// grossissent avec chaque abonné, on pagine donc plutôt que de tronquer en
// silence le jour où le catalogue décolle.
const PAGE = 1000
async function lireTout<T>(table: string, colonnes: string): Promise<T[]> {
  const lignes: T[] = []
  for (let depuis = 0; ; depuis += PAGE) {
    const { data, error } = await supabaseAdmin.from(table).select(colonnes).range(depuis, depuis + PAGE - 1)
    if (error) throw new Error(`${table} : ${error.message}`)
    const lot = (data || []) as unknown as T[]
    lignes.push(...lot)
    if (lot.length < PAGE) return lignes
  }
}

type Profil = { id: string; email: string | null; full_name: string | null; role: string | null }
type Formation = { id: string; title: string | null; is_private: boolean | null; is_free_access: boolean | null; subject_id: string | null; created_at: string | null }
type Chapitre = { id: string; formation_id: string | null; title: string | null; order_index: number | null }
type SousPartie = { id: string; chapter_id: string | null; title: string | null; order_index: number | null; vimeo_url: string | null; pdf_url: string | null }
type Progression = { subpart_id: string | null; user_id: string; completed_at: string | null }
type Quiz = { id: string; subpart_id: string | null; title: string | null; is_active: boolean | null }
type Tentative = { quiz_id: string | null; user_id: string; score: number | null; passed: boolean | null; completed_at: string | null }
type Video = { id: string; title: string | null; region: string | null; category_id: string | null; is_active: boolean | null; is_free_access: boolean | null }
type Categorie = { id: string; name: string | null; color: string | null; order_index: number | null }
type VueVideo = { practice_video_id: string | null; user_id: string; viewed_at: string | null }
type Test = { id: string; name: string | null; category: string | null }
type VueTest = { test_id: string | null; user_id: string; viewed_at: string | null }
type Paquet = { id: string; title: string | null; theme: string | null; total_cards: number | null }
type Carte = { id: string; deck_id: string | null }
type Revision = { deck_id: string | null; card_id: string | null; user_id: string; reviewed_at: string | null; last_rating: number | null; repetition: number | null }
type Certificat = { user_id: string; issued_at: string | null; formation_id?: string | null; deck_id?: string | null }
type Sujet = { id: string; name: string | null; color: string | null }

function jour(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function pourcent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0
}

/** Date la plus récente d’une série, au format ISO, ou null si la série est vide. */
function plusRecente(dates: (string | null)[]): string | null {
  let max = 0
  for (const d of dates) {
    if (!d) continue
    const t = new Date(d).getTime()
    if (t > max) max = t
  }
  return max > 0 ? new Date(max).toISOString() : null
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const inclureAdmins = req.nextUrl.searchParams.get('admins') === 'inclus'

  let donnees
  try {
    donnees = await Promise.all([
      lireTout<Profil>('profiles', 'id, email, full_name, role'),
      lireTout<Sujet>('course_subjects', 'id, name, color'),
      lireTout<Formation>('elearning_formations', 'id, title, is_private, is_free_access, subject_id, created_at'),
      lireTout<Chapitre>('elearning_chapters', 'id, formation_id, title, order_index'),
      lireTout<SousPartie>('elearning_subparts', 'id, chapter_id, title, order_index, vimeo_url, pdf_url'),
      lireTout<Progression>('elearning_subpart_progress', 'subpart_id, user_id, completed_at'),
      lireTout<Quiz>('elearning_quizzes', 'id, subpart_id, title, is_active'),
      lireTout<Tentative>('elearning_quiz_attempts', 'quiz_id, user_id, score, passed, completed_at'),
      lireTout<Video>('practice_videos', 'id, title, region, category_id, is_active, is_free_access'),
      lireTout<Categorie>('practice_categories', 'id, name, color, order_index'),
      lireTout<VueVideo>('user_practice_progress', 'practice_video_id, user_id, viewed_at'),
      lireTout<Test>('orthopedic_tests', 'id, name, category'),
      lireTout<VueTest>('user_testing_progress', 'test_id, user_id, viewed_at'),
      lireTout<Paquet>('flashcard_decks', 'id, title, theme, total_cards'),
      lireTout<Carte>('flashcards', 'id, deck_id'),
      lireTout<Revision>('flashcard_progress', 'deck_id, card_id, user_id, reviewed_at, last_rating, repetition'),
      lireTout<Certificat>('course_certificates', 'user_id, formation_id, issued_at'),
      lireTout<Certificat>('flashcard_certificates', 'user_id, deck_id, issued_at'),
      lireTout<{ id: string }>('literature_reviews', 'id'),
      lireTout<{ id: string; is_active: boolean | null }>('rehab_exercises', 'id, is_active'),
      lireTout<{ id: string }>('encyclopedia_entries', 'id'),
    ])
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Lecture impossible' }, { status: 500 })
  }

  const [
    profils, sujets, formations, chapitres, sousParties, progressions,
    quizzes, tentatives, videos, categories, vuesVideos, tests, vuesTests,
    paquets, cartes, revisions, certifsCours, certifsFlash,
    revuesLitterature, exercices, encyclopedie,
  ] = donnees

  // ── Périmètre ─────────────────────────────────────────────────────────────
  const suivis = new Set(profils.filter(p => inclureAdmins || p.role !== 'admin').map(p => p.id))
  const garde = <T extends { user_id: string }>(lignes: T[]) => lignes.filter(l => suivis.has(l.user_id))

  const prog = garde(progressions)
  const tents = garde(tentatives)
  const vVideos = garde(vuesVideos)
  const vTests = garde(vuesTests)
  const revs = garde(revisions)
  const certCours = garde(certifsCours)
  const certFlash = garde(certifsFlash)

  const maintenant = Date.now()
  const depuis = (n: number) => maintenant - n * MS_DAY
  const recent = (d: string | null, n = 30) => !!d && new Date(d).getTime() >= depuis(n)

  // ── E-learning ────────────────────────────────────────────────────────────
  const chapitreParId = new Map(chapitres.map(c => [c.id, c]))
  const sousPartieParId = new Map(sousParties.map(s => [s.id, s]))
  const formationParId = new Map(formations.map(f => [f.id, f]))
  const sujetParId = new Map(sujets.map(s => [s.id, s]))

  // Rattachement sous-partie -> chapitre -> formation, calculé une fois.
  const formationDeSousPartie = new Map<string, string>()
  const sousPartiesParChapitre = new Map<string, string[]>()
  const sousPartiesParFormation = new Map<string, string[]>()
  for (const sp of sousParties) {
    const ch = sp.chapter_id ? chapitreParId.get(sp.chapter_id) : undefined
    if (!ch?.formation_id) continue
    formationDeSousPartie.set(sp.id, ch.formation_id)
    sousPartiesParChapitre.set(ch.id, [...(sousPartiesParChapitre.get(ch.id) || []), sp.id])
    sousPartiesParFormation.set(ch.formation_id, [...(sousPartiesParFormation.get(ch.formation_id) || []), sp.id])
  }

  const completionsParSousPartie = new Map<string, number>()
  const apprenantsParSousPartie = new Map<string, Set<string>>()
  const completionsParFormationEtUser = new Map<string, Map<string, number>>()
  const apprenantsParChapitre = new Map<string, Set<string>>()
  const completionsParChapitre = new Map<string, number>()
  const datesParFormation = new Map<string, (string | null)[]>()

  for (const p of prog) {
    if (!p.subpart_id) continue
    completionsParSousPartie.set(p.subpart_id, (completionsParSousPartie.get(p.subpart_id) || 0) + 1)
    if (!apprenantsParSousPartie.has(p.subpart_id)) apprenantsParSousPartie.set(p.subpart_id, new Set())
    apprenantsParSousPartie.get(p.subpart_id)!.add(p.user_id)

    const sp = sousPartieParId.get(p.subpart_id)
    if (sp?.chapter_id) {
      completionsParChapitre.set(sp.chapter_id, (completionsParChapitre.get(sp.chapter_id) || 0) + 1)
      if (!apprenantsParChapitre.has(sp.chapter_id)) apprenantsParChapitre.set(sp.chapter_id, new Set())
      apprenantsParChapitre.get(sp.chapter_id)!.add(p.user_id)
    }

    const fid = formationDeSousPartie.get(p.subpart_id)
    if (fid) {
      if (!completionsParFormationEtUser.has(fid)) completionsParFormationEtUser.set(fid, new Map())
      const parUser = completionsParFormationEtUser.get(fid)!
      parUser.set(p.user_id, (parUser.get(p.user_id) || 0) + 1)
      datesParFormation.set(fid, [...(datesParFormation.get(fid) || []), p.completed_at])
    }
  }

  const certifsParFormation = new Map<string, number>()
  for (const c of certCours) {
    if (c.formation_id) certifsParFormation.set(c.formation_id, (certifsParFormation.get(c.formation_id) || 0) + 1)
  }

  const formationsLignes = formations.map(f => {
    const sps = sousPartiesParFormation.get(f.id) || []
    const parUser = completionsParFormationEtUser.get(f.id) || new Map<string, number>()
    const apprenants = parUser.size
    const completions = [...parUser.values()].reduce((s, n) => s + n, 0)
    const avancements = [...parUser.values()].map(n => (sps.length > 0 ? Math.min(n / sps.length, 1) : 0))
    const avancementMoyen = avancements.length > 0
      ? Math.round((avancements.reduce((s, n) => s + n, 0) / avancements.length) * 100)
      : 0
    const termine = sps.length > 0 ? [...parUser.values()].filter(n => n >= sps.length).length : 0
    const sujet = f.subject_id ? sujetParId.get(f.subject_id) : undefined
    return {
      id: f.id,
      titre: f.title || 'Sans titre',
      sujet: sujet?.name || null,
      couleurSujet: sujet?.color || null,
      chapitres: chapitres.filter(c => c.formation_id === f.id).length,
      sousParties: sps.length,
      apprenants,
      completions,
      avancementMoyen,
      termine,
      certificats: certifsParFormation.get(f.id) || 0,
      derniereActivite: plusRecente(datesParFormation.get(f.id) || []),
      privee: !!f.is_private,
      gratuite: !!f.is_free_access,
    }
  }).sort((a, b) => b.apprenants - a.apprenants || b.completions - a.completions)

  const chapitresLignes = chapitres
    .filter(c => c.formation_id)
    .map(c => ({
      id: c.id,
      formationId: c.formation_id as string,
      titre: c.title || 'Sans titre',
      ordre: c.order_index ?? 0,
      sousParties: (sousPartiesParChapitre.get(c.id) || []).length,
      apprenants: (apprenantsParChapitre.get(c.id) || new Set()).size,
      completions: completionsParChapitre.get(c.id) || 0,
    }))
    .sort((a, b) => a.ordre - b.ordre)

  const sousPartiesDormantes = sousParties
    .filter(sp => !completionsParSousPartie.has(sp.id) && formationDeSousPartie.has(sp.id))
    .map(sp => {
      const ch = sp.chapter_id ? chapitreParId.get(sp.chapter_id) : undefined
      const f = ch?.formation_id ? formationParId.get(ch.formation_id) : undefined
      return {
        id: sp.id,
        titre: sp.title || 'Sans titre',
        chapitre: ch?.title || 'Sans chapitre',
        formation: f?.title || 'Sans formation',
        video: !!sp.vimeo_url,
        pdf: !!sp.pdf_url,
      }
    })
    .sort((a, b) => a.formation.localeCompare(b.formation) || a.chapitre.localeCompare(b.chapitre))

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const parQuiz = new Map<string, { tentatives: number; apprenants: Set<string>; reussies: number; scores: number[]; derniere: (string | null)[] }>()
  for (const t of tents) {
    if (!t.quiz_id) continue
    if (!parQuiz.has(t.quiz_id)) parQuiz.set(t.quiz_id, { tentatives: 0, apprenants: new Set(), reussies: 0, scores: [], derniere: [] })
    const q = parQuiz.get(t.quiz_id)!
    q.tentatives++
    q.apprenants.add(t.user_id)
    if (t.passed) q.reussies++
    if (typeof t.score === 'number') q.scores.push(t.score)
    q.derniere.push(t.completed_at)
  }

  const quizLignes = quizzes.map(q => {
    const agg = parQuiz.get(q.id)
    const sp = q.subpart_id ? sousPartieParId.get(q.subpart_id) : undefined
    const fid = q.subpart_id ? formationDeSousPartie.get(q.subpart_id) : undefined
    const f = fid ? formationParId.get(fid) : undefined
    return {
      id: q.id,
      titre: q.title || sp?.title || 'Sans titre',
      sousPartie: sp?.title || null,
      formation: f?.title || null,
      actif: q.is_active !== false,
      tentatives: agg?.tentatives || 0,
      apprenants: agg?.apprenants.size || 0,
      reussite: agg && agg.tentatives > 0 ? Math.round((agg.reussies / agg.tentatives) * 100) : null,
      scoreMoyen: agg && agg.scores.length > 0 ? Math.round(agg.scores.reduce((s, n) => s + n, 0) / agg.scores.length) : null,
      derniereActivite: plusRecente(agg?.derniere || []),
    }
  })

  const quizTentes = quizLignes.filter(q => q.tentatives > 0)
  const quizReussies = tents.filter(t => t.passed).length

  // ── Vidéos de pratique ────────────────────────────────────────────────────
  const vuesParVideo = new Map<string, number>()
  const apprenantsParVideo = new Map<string, Set<string>>()
  const datesParVideo = new Map<string, (string | null)[]>()
  for (const v of vVideos) {
    if (!v.practice_video_id) continue
    vuesParVideo.set(v.practice_video_id, (vuesParVideo.get(v.practice_video_id) || 0) + 1)
    if (!apprenantsParVideo.has(v.practice_video_id)) apprenantsParVideo.set(v.practice_video_id, new Set())
    apprenantsParVideo.get(v.practice_video_id)!.add(v.user_id)
    datesParVideo.set(v.practice_video_id, [...(datesParVideo.get(v.practice_video_id) || []), v.viewed_at])
  }

  const categorieParId = new Map(categories.map(c => [c.id, c]))
  const videosActives = videos.filter(v => v.is_active !== false)
  const ligneVideo = (v: Video) => ({
    id: v.id,
    titre: v.title || 'Sans titre',
    categorie: v.category_id ? categorieParId.get(v.category_id)?.name || null : null,
    couleur: v.category_id ? categorieParId.get(v.category_id)?.color || null : null,
    region: v.region || null,
    vues: vuesParVideo.get(v.id) || 0,
    apprenants: (apprenantsParVideo.get(v.id) || new Set()).size,
    derniereActivite: plusRecente(datesParVideo.get(v.id) || []),
    gratuite: !!v.is_free_access,
  })

  const videosLignes = videosActives.map(ligneVideo)
  const videosVues = videosLignes.filter(v => v.vues > 0).sort((a, b) => b.vues - a.vues)
  const videosDormantes = videosLignes.filter(v => v.vues === 0).sort((a, b) => (a.categorie || '').localeCompare(b.categorie || ''))

  const ligneParVideoId = new Map(videosLignes.map(l => [l.id, l]))
  const agregeParCle = (cle: (v: ReturnType<typeof ligneVideo>) => string | null) => {
    const map = new Map<string, { nom: string; vues: number; contenus: number; utilises: number; apprenants: Set<string>; couleur: string | null }>()
    const entree = (k: string, couleur: string | null) => {
      if (!map.has(k)) map.set(k, { nom: k, vues: 0, contenus: 0, utilises: 0, apprenants: new Set(), couleur })
      return map.get(k)!
    }
    for (const l of videosLignes) {
      const e = entree(cle(l) || 'Non classé', l.couleur)
      e.vues += l.vues
      e.contenus++
      if (l.vues > 0) e.utilises++
    }
    // Les apprenants distincts se comptent sur les vues, pas sur le catalogue :
    // un même praticien qui regarde dix vidéos HVLA ne fait qu’un apprenant.
    for (const v of vVideos) {
      const l = v.practice_video_id ? ligneParVideoId.get(v.practice_video_id) : undefined
      if (!l) continue
      entree(cle(l) || 'Non classé', l.couleur).apprenants.add(v.user_id)
    }
    return [...map.values()]
      .map(e => ({ nom: e.nom, vues: e.vues, contenus: e.contenus, utilises: e.utilises, apprenants: e.apprenants.size, couleur: e.couleur }))
      .sort((a, b) => b.vues - a.vues)
  }

  const pratiqueParCategorie = agregeParCle(v => v.categorie)
  const pratiqueParRegion = agregeParCle(v => v.region)

  // ── Tests orthopédiques ───────────────────────────────────────────────────
  const vuesParTest = new Map<string, number>()
  const apprenantsParTest = new Map<string, Set<string>>()
  for (const v of vTests) {
    if (!v.test_id) continue
    vuesParTest.set(v.test_id, (vuesParTest.get(v.test_id) || 0) + 1)
    if (!apprenantsParTest.has(v.test_id)) apprenantsParTest.set(v.test_id, new Set())
    apprenantsParTest.get(v.test_id)!.add(v.user_id)
  }
  const testsLignes = tests.map(t => ({
    id: t.id,
    titre: t.name || 'Sans nom',
    categorie: t.category || null,
    vues: vuesParTest.get(t.id) || 0,
    apprenants: (apprenantsParTest.get(t.id) || new Set()).size,
  }))
  const testsVus = testsLignes.filter(t => t.vues > 0).sort((a, b) => b.vues - a.vues)

  // Aucune application n’écrit plus dans `user_testing_progress` : les quelques
  // lignes restantes sont historiques. Sans ce garde-fou, la page annoncerait
  // « 118 tests jamais ouverts », ce qui est un trou de mesure, pas un verdict
  // sur le contenu. On coupe donc au premier signe d’un suivi à l’arrêt.
  const dernierTest = plusRecente(vuesTests.map(v => v.viewed_at))
  const suiviTests = !!dernierTest && new Date(dernierTest).getTime() >= depuis(180)

  // ── Flashcards ────────────────────────────────────────────────────────────
  const cartesParPaquet = new Map<string, number>()
  for (const c of cartes) {
    if (c.deck_id) cartesParPaquet.set(c.deck_id, (cartesParPaquet.get(c.deck_id) || 0) + 1)
  }
  const certifsParPaquet = new Map<string, number>()
  for (const c of certFlash) {
    if (c.deck_id) certifsParPaquet.set(c.deck_id, (certifsParPaquet.get(c.deck_id) || 0) + 1)
  }
  const paquetsLignes = paquets.map(d => {
    const lignes = revs.filter(r => r.deck_id === d.id)
    const notes = lignes.map(r => r.last_rating).filter((n): n is number => typeof n === 'number')
    const total = cartesParPaquet.get(d.id) || d.total_cards || 0
    return {
      id: d.id,
      titre: d.title || 'Sans titre',
      theme: d.theme || null,
      cartes: total,
      cartesTravaillees: new Set(lignes.map(r => r.card_id)).size,
      apprenants: new Set(lignes.map(r => r.user_id)).size,
      revisions: lignes.length,
      noteMoyenne: notes.length > 0 ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10 : null,
      oubliees: notes.filter(n => n === 1).length,
      certificats: certifsParPaquet.get(d.id) || 0,
      derniereActivite: plusRecente(lignes.map(r => r.reviewed_at)),
    }
  }).sort((a, b) => b.revisions - a.revisions)

  const cartesTravaillees = new Set(revs.map(r => r.card_id)).size

  // ── Couverture du catalogue ───────────────────────────────────────────────
  const quizActifs = quizLignes.filter(q => q.actif)
  const couverture = [
    { cle: 'elearning', label: 'Sous-parties de cours', catalogue: sousParties.length, utilises: completionsParSousPartie.size },
    { cle: 'quiz', label: 'Quiz', catalogue: quizActifs.length, utilises: quizActifs.filter(q => q.tentatives > 0).length },
    { cle: 'pratique', label: 'Vidéos de pratique', catalogue: videosActives.length, utilises: videosVues.length },
    ...(suiviTests ? [{ cle: 'tests', label: 'Tests orthopédiques', catalogue: tests.length, utilises: testsVus.length }] : []),
    { cle: 'flashcards', label: 'Flashcards', catalogue: cartes.length, utilises: cartesTravaillees },
  ].map(c => ({ ...c, dormants: Math.max(c.catalogue - c.utilises, 0), part: pourcent(c.utilises, c.catalogue) }))

  // ── Familles : ce qui tourne vraiment sur 30 jours ────────────────────────
  const famille = (
    cle: string,
    label: string,
    lignes: { user_id: string }[],
    champ: string,
  ) => {
    const apprenants = new Set<string>()
    let actions30 = 0
    const dates: (string | null)[] = []
    for (const l of lignes as any[]) {
      const d = l[champ] as string | null
      dates.push(d)
      if (recent(d)) { actions30++; apprenants.add(l.user_id) }
    }
    return { cle, label, actions30, actionsTotal: lignes.length, apprenants30: apprenants.size, derniereActivite: plusRecente(dates) }
  }

  const familles = [
    famille('elearning', 'E-learning', prog, 'completed_at'),
    famille('quiz', 'Quiz', tents, 'completed_at'),
    famille('pratique', 'Vidéos de pratique', vVideos, 'viewed_at'),
    famille('tests', 'Tests orthopédiques', vTests, 'viewed_at'),
    famille('flashcards', 'Flashcards', revs, 'reviewed_at'),
  ].sort((a, b) => b.actions30 - a.actions30)

  // ── Chronologie (90 jours, toutes familles) ───────────────────────────────
  const serie = new Map<string, { date: string; elearning: number; quiz: number; pratique: number; tests: number; flashcards: number }>()
  for (let i = FENETRE_JOURS - 1; i >= 0; i--) {
    const k = jour(new Date(maintenant - i * MS_DAY))
    serie.set(k, { date: k, elearning: 0, quiz: 0, pratique: 0, tests: 0, flashcards: 0 })
  }
  const ajoute = (d: string | null, cle: 'elearning' | 'quiz' | 'pratique' | 'tests' | 'flashcards') => {
    if (!d) return
    const k = jour(new Date(d))
    const ligne = serie.get(k)
    if (ligne) ligne[cle]++
  }
  prog.forEach(p => ajoute(p.completed_at, 'elearning'))
  tents.forEach(t => ajoute(t.completed_at, 'quiz'))
  vVideos.forEach(v => ajoute(v.viewed_at, 'pratique'))
  vTests.forEach(v => ajoute(v.viewed_at, 'tests'))
  revs.forEach(r => ajoute(r.reviewed_at, 'flashcards'))

  // ── Membres les plus actifs sur les contenus (30 jours) ───────────────────
  const profilParId = new Map(profils.map(p => [p.id, p]))
  const parMembre = new Map<string, { elearning: number; quiz: number; pratique: number; tests: number; flashcards: number }>()
  const compte = (userId: string, cle: 'elearning' | 'quiz' | 'pratique' | 'tests' | 'flashcards') => {
    if (!parMembre.has(userId)) parMembre.set(userId, { elearning: 0, quiz: 0, pratique: 0, tests: 0, flashcards: 0 })
    parMembre.get(userId)![cle]++
  }
  prog.forEach(p => recent(p.completed_at) && compte(p.user_id, 'elearning'))
  tents.forEach(t => recent(t.completed_at) && compte(t.user_id, 'quiz'))
  vVideos.forEach(v => recent(v.viewed_at) && compte(v.user_id, 'pratique'))
  vTests.forEach(v => recent(v.viewed_at) && compte(v.user_id, 'tests'))
  revs.forEach(r => recent(r.reviewed_at) && compte(r.user_id, 'flashcards'))

  const actifs30 = parMembre.size

  const membres = [...parMembre.entries()]
    .map(([id, d]) => {
      const p = profilParId.get(id)
      return {
        id,
        nom: p?.full_name || null,
        email: p?.email || null,
        role: p?.role || null,
        total: d.elearning + d.quiz + d.pratique + d.tests + d.flashcards,
        ...d,
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)

  // ── Contenus sans mesure d’usage ──────────────────────────────────────────
  // Ces rubriques existent en base mais rien n’enregistre leur consultation :
  // impossible de dire si elles plaisent ou non. Les tests orthopédiques les
  // rejoignent quand leur suivi ne reçoit plus rien.
  const sansSuivi = [
    { label: 'Revue de littérature', catalogue: revuesLitterature.length, note: 'aucune consultation enregistrée' },
    { label: 'Exercices de rééducation', catalogue: exercices.filter(e => e.is_active !== false).length, note: 'aucune consultation enregistrée' },
    { label: 'Encyclopédie', catalogue: encyclopedie.length, note: 'aucune consultation enregistrée' },
    ...(suiviTests ? [] : [{
      label: 'Tests orthopédiques',
      catalogue: tests.length,
      note: dernierTest
        ? `suivi à l’arrêt, dernière trace le ${new Date(dernierTest).toLocaleDateString('fr-FR')}`
        : 'suivi jamais alimenté',
    }]),
  ]

  return NextResponse.json({
    perimetre: {
      inclureAdmins,
      comptes: suivis.size,
      comptesTotal: profils.length,
      admins: profils.filter(p => p.role === 'admin').length,
      actifs30,
    },
    couverture,
    familles,
    timeline: [...serie.values()],
    elearning: {
      formations: formationsLignes,
      chapitres: chapitresLignes,
      dormantes: sousPartiesDormantes,
      apprenants: new Set(prog.map(p => p.user_id)).size,
      completions: prog.length,
      certificats: certCours.length,
    },
    quiz: {
      lignes: quizLignes.sort((a, b) => b.tentatives - a.tentatives),
      tentatives: tents.length,
      apprenants: new Set(tents.map(t => t.user_id)).size,
      reussite: tents.length > 0 ? Math.round((quizReussies / tents.length) * 100) : 0,
      jamaisTentes: quizActifs.length - quizTentes.filter(q => q.actif).length,
    },
    pratique: {
      parCategorie: pratiqueParCategorie,
      parRegion: pratiqueParRegion,
      vues: videosVues,
      dormantes: videosDormantes,
      total: videosActives.length,
      vuesTotal: vVideos.length,
      apprenants: new Set(vVideos.map(v => v.user_id)).size,
    },
    tests: {
      suivi: suiviTests,
      dernierEnregistrement: dernierTest,
      vus: testsVus,
      dormants: testsLignes.length - testsVus.length,
      total: testsLignes.length,
      vuesTotal: vTests.length,
      apprenants: new Set(vTests.map(v => v.user_id)).size,
    },
    flashcards: {
      paquets: paquetsLignes,
      revisions: revs.length,
      apprenants: new Set(revs.map(r => r.user_id)).size,
      cartes: cartes.length,
      cartesTravaillees,
      certificats: certFlash.length,
    },
    membres,
    sansSuivi,
    generatedAt: new Date().toISOString(),
  })
}
