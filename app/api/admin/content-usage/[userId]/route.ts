import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { supabaseAdmin } from '@/lib/supabase-server'
import { MS_DAY, jourISO, lireTout, plusRecente, serieVide, type FamilleCle } from '@/lib/admin-content-usage'

/**
 * Usage des contenus pour un client donné.
 *
 * La page `/admin/contenus` dit quelle formation marche ; cette route dit où en
 * est Untel. C’est ce qu’il faut sous les yeux avant d’appeler un abonné qui ne
 * renouvelle pas : a-t-il seulement ouvert un cours, s’est-il arrêté au
 * chapitre 3, a-t-il buté sur un quiz.
 *
 * Les tables de progression sont lues filtrées sur l’utilisateur ; le catalogue
 * est lu en entier, il est petit et sert à nommer chaque contenu.
 */

export const dynamic = 'force-dynamic'

type Formation = { id: string; title: string | null; is_free_access: boolean | null }
type Chapitre = { id: string; formation_id: string | null; title: string | null; order_index: number | null }
type SousPartie = { id: string; chapter_id: string | null; title: string | null; order_index: number | null }
type Quiz = { id: string; subpart_id: string | null; title: string | null }
type Video = { id: string; title: string | null; region: string | null; category_id: string | null }
type Categorie = { id: string; name: string | null; color: string | null }
type Paquet = { id: string; title: string | null; total_cards: number | null }
type Test = { id: string; name: string | null; category: string | null }

export async function GET(_request: Request, { params }: { params: { userId: string } }) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = params.userId

  const { data: profil, error: erreurProfil } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, plan, subscription_status, is_founding_member, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (erreurProfil) return NextResponse.json({ error: erreurProfil.message }, { status: 500 })
  if (!profil) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  let donnees
  try {
    donnees = await Promise.all([
      lireTout<Formation>('elearning_formations', 'id, title, is_free_access'),
      lireTout<Chapitre>('elearning_chapters', 'id, formation_id, title, order_index'),
      lireTout<SousPartie>('elearning_subparts', 'id, chapter_id, title, order_index'),
      lireTout<Quiz>('elearning_quizzes', 'id, subpart_id, title'),
      lireTout<Video>('practice_videos', 'id, title, region, category_id'),
      lireTout<Categorie>('practice_categories', 'id, name, color'),
      lireTout<Paquet>('flashcard_decks', 'id, title, total_cards'),
      lireTout<{ id: string; deck_id: string | null }>('flashcards', 'id, deck_id'),
      lireTout<Test>('orthopedic_tests', 'id, name, category'),
      lireTout<{ subpart_id: string | null; completed_at: string | null }>('elearning_subpart_progress', 'subpart_id, completed_at', { colonne: 'user_id', valeur: userId }),
      lireTout<{ quiz_id: string | null; score: number | null; passed: boolean | null; completed_at: string | null }>('elearning_quiz_attempts', 'quiz_id, score, passed, completed_at', { colonne: 'user_id', valeur: userId }),
      lireTout<{ practice_video_id: string | null; viewed_at: string | null }>('user_practice_progress', 'practice_video_id, viewed_at', { colonne: 'user_id', valeur: userId }),
      lireTout<{ test_id: string | null; viewed_at: string | null }>('user_testing_progress', 'test_id, viewed_at', { colonne: 'user_id', valeur: userId }),
      lireTout<{ deck_id: string | null; card_id: string | null; reviewed_at: string | null; last_rating: number | null }>('flashcard_progress', 'deck_id, card_id, reviewed_at, last_rating', { colonne: 'user_id', valeur: userId }),
      lireTout<{ formation_id: string | null; issued_at: string | null }>('course_certificates', 'formation_id, issued_at', { colonne: 'user_id', valeur: userId }),
      lireTout<{ deck_id: string | null; issued_at: string | null }>('flashcard_certificates', 'deck_id, issued_at', { colonne: 'user_id', valeur: userId }),
    ])
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Lecture impossible' }, { status: 500 })
  }

  const [
    formations, chapitres, sousParties, quizzes, videos, categories, paquets, cartes, tests,
    prog, tentatives, vuesVideos, vuesTests, revisions, certifsCours, certifsFlash,
  ] = donnees

  const { data: gami } = await supabaseAdmin
    .from('user_gamification_stats')
    .select('level, total_xp, current_streak, best_streak, last_login_date, total_logins')
    .eq('user_id', userId)
    .maybeSingle()

  const maintenant = Date.now()
  const recent = (d: string | null | undefined, n = 30) => !!d && new Date(d).getTime() >= maintenant - n * MS_DAY

  // ── E-learning : où en est ce client, formation par formation ─────────────
  const chapitreParId = new Map(chapitres.map(c => [c.id, c]))
  const sousPartieParId = new Map(sousParties.map(s => [s.id, s]))

  const sousPartiesParChapitre = new Map<string, SousPartie[]>()
  for (const sp of sousParties) {
    if (!sp.chapter_id) continue
    if (!sousPartiesParChapitre.has(sp.chapter_id)) sousPartiesParChapitre.set(sp.chapter_id, [])
    sousPartiesParChapitre.get(sp.chapter_id)!.push(sp)
  }

  const valideeLe = new Map<string, string | null>()
  for (const p of prog) {
    if (p.subpart_id) valideeLe.set(p.subpart_id, p.completed_at)
  }

  const certifParFormation = new Map<string, string | null>()
  for (const c of certifsCours) {
    if (c.formation_id) certifParFormation.set(c.formation_id, c.issued_at)
  }

  const formationsLignes = formations.map(f => {
    const chaps = chapitres
      .filter(c => c.formation_id === f.id)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    let total = 0, validees = 0
    const dates: (string | null)[] = []
    const lignesChapitres = chaps.map(c => {
      const sps = sousPartiesParChapitre.get(c.id) || []
      const faites = sps.filter(sp => valideeLe.has(sp.id))
      total += sps.length
      validees += faites.length
      faites.forEach(sp => dates.push(valideeLe.get(sp.id) ?? null))
      return {
        id: c.id,
        titre: c.title || 'Sans titre',
        sousParties: sps.length,
        validees: faites.length,
      }
    })
    return {
      id: f.id,
      titre: f.title || 'Sans titre',
      gratuite: !!f.is_free_access,
      sousParties: total,
      validees,
      avancement: total > 0 ? Math.round((validees / total) * 100) : 0,
      derniereActivite: plusRecente(dates),
      certificat: certifParFormation.get(f.id) ?? null,
      chapitres: lignesChapitres,
    }
  }).sort((a, b) => b.validees - a.validees || b.avancement - a.avancement)

  // ── Quiz : score, réussite, nombre d’essais ───────────────────────────────
  const parQuiz = new Map<string, { tentatives: number; meilleur: number | null; reussi: boolean; dates: (string | null)[] }>()
  for (const t of tentatives) {
    if (!t.quiz_id) continue
    if (!parQuiz.has(t.quiz_id)) parQuiz.set(t.quiz_id, { tentatives: 0, meilleur: null, reussi: false, dates: [] })
    const e = parQuiz.get(t.quiz_id)!
    e.tentatives++
    if (typeof t.score === 'number' && (e.meilleur === null || t.score > e.meilleur)) e.meilleur = t.score
    if (t.passed) e.reussi = true
    e.dates.push(t.completed_at)
  }
  const quizParId = new Map(quizzes.map(q => [q.id, q]))
  const quizLignes = [...parQuiz.entries()].map(([id, e]) => {
    const q = quizParId.get(id)
    const sp = q?.subpart_id ? sousPartieParId.get(q.subpart_id) : undefined
    const ch = sp?.chapter_id ? chapitreParId.get(sp.chapter_id) : undefined
    const f = ch?.formation_id ? formations.find(x => x.id === ch.formation_id) : undefined
    return {
      id,
      titre: q?.title || sp?.title || 'Quiz supprimé',
      formation: f?.title || null,
      tentatives: e.tentatives,
      meilleurScore: e.meilleur,
      reussi: e.reussi,
      derniereActivite: plusRecente(e.dates),
    }
  }).sort((a, b) => Number(a.reussi) - Number(b.reussi) || b.tentatives - a.tentatives)

  // ── Vidéos de pratique ────────────────────────────────────────────────────
  const videoParId = new Map(videos.map(v => [v.id, v]))
  const categorieParId = new Map(categories.map(c => [c.id, c]))
  const parCategorie = new Map<string, number>()
  const vuesDetaillees = vuesVideos
    .map(v => {
      const vid = v.practice_video_id ? videoParId.get(v.practice_video_id) : undefined
      const cat = vid?.category_id ? categorieParId.get(vid.category_id)?.name || null : null
      if (vid) parCategorie.set(cat || 'Non classé', (parCategorie.get(cat || 'Non classé') || 0) + 1)
      return {
        titre: vid?.title || 'Vidéo supprimée',
        categorie: cat,
        region: vid?.region || null,
        vueLe: v.viewed_at,
      }
    })
    .sort((a, b) => new Date(b.vueLe || 0).getTime() - new Date(a.vueLe || 0).getTime())

  // ── Flashcards ────────────────────────────────────────────────────────────
  const cartesParPaquet = new Map<string, number>()
  for (const c of cartes) {
    if (c.deck_id) cartesParPaquet.set(c.deck_id, (cartesParPaquet.get(c.deck_id) || 0) + 1)
  }
  const certifParPaquet = new Map<string, string | null>()
  for (const c of certifsFlash) {
    if (c.deck_id) certifParPaquet.set(c.deck_id, c.issued_at)
  }
  const paquetsLignes = paquets.map(d => {
    const lignes = revisions.filter(r => r.deck_id === d.id)
    const notes = lignes.map(r => r.last_rating).filter((n): n is number => typeof n === 'number')
    const total = cartesParPaquet.get(d.id) || d.total_cards || 0
    return {
      id: d.id,
      titre: d.title || 'Sans titre',
      cartes: total,
      travaillees: new Set(lignes.map(r => r.card_id)).size,
      revisions: lignes.length,
      noteMoyenne: notes.length > 0 ? Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10 : null,
      oubliees: notes.filter(n => n === 1).length,
      certificat: certifParPaquet.get(d.id) ?? null,
      derniereActivite: plusRecente(lignes.map(r => r.reviewed_at)),
    }
  }).filter(p => p.revisions > 0)
    .sort((a, b) => b.revisions - a.revisions)

  // ── Tests orthopédiques ───────────────────────────────────────────────────
  const testParId = new Map(tests.map(t => [t.id, t]))
  const testsLignes = vuesTests
    .map(v => ({
      titre: (v.test_id ? testParId.get(v.test_id)?.name : null) || 'Test supprimé',
      vueLe: v.viewed_at,
    }))
    .sort((a, b) => new Date(b.vueLe || 0).getTime() - new Date(a.vueLe || 0).getTime())

  // ── Familles et chronologie ───────────────────────────────────────────────
  const famille = (cle: FamilleCle, label: string, dates: (string | null)[]) => ({
    cle,
    label,
    actions30: dates.filter(d => recent(d)).length,
    actionsTotal: dates.length,
    derniereActivite: plusRecente(dates),
  })

  const datesElearning = prog.map(p => p.completed_at)
  const datesQuiz = tentatives.map(t => t.completed_at)
  const datesPratique = vuesVideos.map(v => v.viewed_at)
  const datesTests = vuesTests.map(v => v.viewed_at)
  const datesFlash = revisions.map(r => r.reviewed_at)

  const familles = [
    famille('elearning', 'E-learning', datesElearning),
    famille('quiz', 'Quiz', datesQuiz),
    famille('pratique', 'Vidéos de pratique', datesPratique),
    famille('tests', 'Tests orthopédiques', datesTests),
    famille('flashcards', 'Flashcards', datesFlash),
  ]

  const serie = serieVide(maintenant)
  const ajoute = (dates: (string | null)[], cle: FamilleCle) => {
    for (const d of dates) {
      if (!d) continue
      const ligne = serie.get(jourISO(new Date(d)))
      if (ligne) ligne[cle]++
    }
  }
  ajoute(datesElearning, 'elearning')
  ajoute(datesQuiz, 'quiz')
  ajoute(datesPratique, 'pratique')
  ajoute(datesTests, 'tests')
  ajoute(datesFlash, 'flashcards')

  const toutesDates = [...datesElearning, ...datesQuiz, ...datesPratique, ...datesTests, ...datesFlash]

  return NextResponse.json({
    client: {
      id: profil.id,
      nom: profil.full_name,
      email: profil.email,
      role: profil.role,
      plan: profil.plan,
      statutAbonnement: profil.subscription_status,
      fondateur: !!profil.is_founding_member,
      inscritLe: profil.created_at,
    },
    gamification: gami
      ? {
          niveau: gami.level ?? null,
          xp: gami.total_xp ?? null,
          streak: gami.current_streak ?? null,
          meilleurStreak: gami.best_streak ?? null,
          dernierLogin: gami.last_login_date ?? null,
          connexions: gami.total_logins ?? null,
        }
      : null,
    synthese: {
      actions30: toutesDates.filter(d => recent(d)).length,
      actionsTotal: toutesDates.length,
      derniereActivite: plusRecente(toutesDates),
      familles,
    },
    formations: formationsLignes,
    quiz: quizLignes,
    pratique: {
      vues: vuesVideos.length,
      videosDistinctes: new Set(vuesVideos.map(v => v.practice_video_id)).size,
      parCategorie: [...parCategorie].map(([nom, vues]) => ({ nom, vues })).sort((a, b) => b.vues - a.vues),
      dernieres: vuesDetaillees.slice(0, 15),
    },
    flashcards: {
      paquets: paquetsLignes,
      revisions: revisions.length,
      cartesTravaillees: new Set(revisions.map(r => r.card_id)).size,
    },
    tests: { vues: testsLignes.slice(0, 15), total: testsLignes.length },
    timeline: [...serie.values()],
    generatedAt: new Date().toISOString(),
  })
}
