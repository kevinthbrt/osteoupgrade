/* eslint-disable react/no-unescaped-entities */
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import PublicFooter from '@/components/PublicFooter'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Menu,
  X,
  Crown,
  Gift,
  Lock,
  HardDrive,
  ShieldCheck,
  DatabaseBackup,
  Plus,
  Minus,
} from 'lucide-react'
import { OFFERS, formatAmount, BUNDLE_SAVING, annualSavingOf, studentFirstYearAmount, STUDENT_DISCOUNT_PERCENT } from '@/lib/offers'

/*
 * Page d'accueil OsteoUpgrade × MyOsteoflow.
 *
 * Construite autour de ce qui est vraiment utile au praticien (voir
 * docs/FONCTIONNALITES.md) : le raisonnement clinique assisté pendant la
 * séance, les courriers, les exercices sur le téléphone du patient, le
 * pilotage du cabinet, puis OsteoUpgrade. Les visuels de public/landing/v2
 * sont tirés de l'application réelle, avec un cabinet de démonstration aux
 * données fictives.
 */

// Animation d'apparition au défilement, désactivée si l'utilisateur réduit les animations
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

// Brand lockup : "OsteoUpgrade × MyOsteoflow"
function BrandLockup({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`}>
      <span>
        Osteo<span className="text-sky-500">Upgrade</span>
      </span>
      <span className="text-slate-900 font-normal">×</span>
      <span className="font-display italic flow-text font-bold">MyOsteoflow</span>
    </span>
  )
}

function Check({ tone = 'blue' }: { tone?: 'blue' | 'violet' | 'sky' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    sky: 'bg-sky-100 text-sky-700',
  }
  return (
    <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-extrabold ${colors[tone]}`} aria-hidden="true">
      ✓
    </span>
  )
}

/** Vidéo de démonstration en boucle, sans son ; une image fixe si l'utilisateur réduit les animations. */
function DemoVideo({ src, poster, label, className = '' }: { src: string; poster: string; label: string; className?: string }) {
  const [reduced, setReduced] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    setReduced(!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  }, [])
  // React ne pose pas l'attribut muted au premier rendu : sans cela, les
  // navigateurs bloquent la lecture automatique. On force le mode muet et on
  // ne lit la vidéo que lorsqu'elle est à l'écran.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {})
      else el.pause()
    }, { threshold: 0.25 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [reduced])
  if (reduced) {
    return <Image src={poster} alt={label} width={1280} height={800} className={className} />
  }
  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      className={className}
    />
  )
}

const RED_FLAGS = [
  'Douleur nocturne non mécanique',
  'Amaigrissement, fièvre',
  'Antécédent de cancer',
  'Déficit neurologique',
  'Troubles sphinctériens',
  'Traumatisme, ostéoporose',
  'Signes cardiovasculaires',
  'Céphalée brutale',
]

const APP_STEPS = [
  {
    img: '/landing/v2/appli-patient-1.webp',
    alt: 'Appli patient : douleur du matin et séance du jour avec trois exercices illustrés',
    title: 'Vous prescrivez, il reçoit un lien',
    text: 'L’IA propose un programme adapté au patient, vous l’ajustez. Il reçoit un simple lien, ouvert sur son téléphone : rien à installer.',
  },
  {
    img: '/landing/v2/appli-patient-2.webp',
    alt: 'Séance guidée : exercice 1 sur 3, illustration et consigne',
    title: 'Une séance guidée, chaque jour prévu',
    text: 'Chaque exercice est illustré et expliqué, série par série. Le matin, il note sa douleur de 0 à 10 : l’évolution se dessine.',
  },
  {
    img: '/landing/v2/appli-patient-3.webp',
    alt: 'Bilan à montrer au praticien : QR code et code à saisir',
    title: 'Son bilan arrive dans votre dossier',
    text: 'En consultation, vous scannez le QR code de son bilan : séances faites et douleur rejoignent le dossier, et vous ajustez le programme.',
  },
]

const DAILY = [
  { title: 'Finalisation en une fenêtre', text: 'Facture PDF avec votre tampon, conseils post-séance choisis pour le patient, suivi et relance programmés.' },
  { title: 'Suivi après la séance', text: 'Un questionnaire part au délai que vous choisissez : douleur, mobilité, satisfaction, analysés dans l’appli.' },
  { title: 'Relance des patients', text: 'Retrouvez ceux que vous n’avez pas revus et relancez-les avec votre lien de prise de rendez-vous.' },
]

// Volumes relevés dans la base le 4 novembre 2026 (docs/FONCTIONNALITES.md)
const OU_STATS = [
  { value: '7', label: 'formations en ligne' },
  { value: '135', label: 'tests orthopédiques filmés' },
  { value: '246', label: 'vidéos de techniques' },
  { value: '356', label: 'flashcards OsteoFlash' },
  { value: '27', label: 'revues de littérature' },
  { value: '137', label: 'exercices de rééducation' },
]

const OU_TABS = [
  {
    label: 'E-learning',
    title: 'Des formations courtes, construites par région',
    text: 'Chaque formation suit le raisonnement clinique : épidémiologie, anamnèse, triage, examen, tests, prise en charge. En vidéo, chapitre par chapitre, avec un quiz pour valider.',
    points: ['7 formations, 220 parties', 'Quiz de validation et attestation de fin', 'Votre progression, reprise là où vous l’avez laissée'],
    img: '/landing/screenshots/elearning.png',
    alt: 'Formation en ligne sur l’examen clinique de l’épaule',
    w: 1652, h: 909,
  },
  {
    label: 'Tests orthopédiques',
    title: 'Le bon test, sa vidéo, sa valeur',
    text: 'Chaque test est filmé, expliqué et accompagné de sa sensibilité et de sa spécificité. Regroupés en clusters par région, ils s’insèrent dans votre examen avec @ec.',
    points: ['135 tests filmés, 9 clusters', 'Sensibilité et spécificité affichées', 'Insertion directe dans la consultation MyOsteoflow'],
    img: '/landing/screenshots/tests.png',
    alt: 'Bibliothèque de tests orthopédiques du membre supérieur',
    w: 1677, h: 903,
  },
  {
    label: 'Techniques en vidéo',
    title: 'Des techniques concrètes, à revoir avant la séance',
    text: 'Mobilisations et techniques classées par région, filmées en situation, pour revoir un geste en deux minutes entre deux patients.',
    points: ['246 vidéos de pratique', 'Classées par région et par type', 'Accessibles depuis le tableau de bord MyOsteoflow'],
    img: '/landing/screenshots/videos.png',
    alt: 'Vidéos de techniques de mobilisation cervicale',
    w: 1654, h: 883,
  },
  {
    label: 'Revue de littérature',
    title: 'La recherche, déjà lue et résumée pour vous',
    text: 'Chaque mois, une étude récente utile au cabinet, résumée en quelques minutes de lecture avec ce qu’elle change pour votre pratique.',
    points: ['27 revues publiées', 'Classées par thème et par région', 'La dernière revue s’affiche dans votre tableau de bord'],
    img: '/landing/screenshots/revue.png',
    alt: 'Articles de revue de littérature classés par thème',
    w: 1667, h: 843,
  },
  {
    label: 'Topographie',
    title: 'Où ça fait mal, et ce que ça peut être',
    text: 'Des vues anatomiques par région qui relient la localisation de la douleur aux structures et aux pathologies à évoquer.',
    points: ['Vues par région, descriptions cliniques', 'Ouverte depuis la consultation MyOsteoflow', 'Pathologies et structures décrites pour chaque zone'],
    img: '/landing/screenshots/topographie.png',
    alt: 'Topographie du coude, vue latérale, pathologies associées',
    w: 1289, h: 753,
  },
]

const TRUST = [
  { icon: HardDrive, title: 'Sur votre ordinateur', text: 'Dossiers patients et consultations sont enregistrés sur votre poste, pas sur un serveur.' },
  { icon: Lock, title: 'Verrouillé par code PIN', text: 'Verrouillage automatique après inactivité, ou d’un clic entre deux patients.' },
  { icon: DatabaseBackup, title: 'Sauvegarde en un clic', text: 'Avec un rappel automatique quand la dernière remonte à trop longtemps.' },
  { icon: ShieldCheck, title: 'RGPD intégré', text: 'Export et suppression des données d’un patient, journal d’activité.' },
]

// Repris de docs/FONCTIONNALITES.md : les « star » sont les arguments phares
const ALL_FEATURES: Array<{ title: string; items: Array<{ text: string; star?: boolean; tag?: string }> }> = [
  { title: 'Mener la séance', items: [
    { text: 'Dictée de l’anamnèse structurée par l’IA', star: true },
    { text: 'Dépistage actif des drapeaux rouges', star: true },
    { text: 'Hypothèses cliniques, questions et tests, recalculés en direct', star: true },
    { text: 'Tests orthopédiques avec @ec, vos techniques avec @tech', star: true },
    { text: 'Antécédents détectés dans la dictée, à valider un par un' },
    { text: 'Arbres décisionnels lombalgie et cervicalgie' },
    { text: 'Topographie', tag: 'OsteoUpgrade' },
    { text: 'Pièces jointes' },
    { text: 'Brouillon enregistré en continu' },
  ] },
  { title: 'Après la séance', items: [
    { text: 'Courriers rédigés à partir de la consultation', star: true },
    { text: 'Programmes d’exercices par IA, sur le téléphone du patient', star: true },
    { text: 'Finalisation en une fenêtre : facture, conseils, suivi' },
    { text: 'Factures PDF avec tampon, paiements multiples' },
    { text: 'Conseils post-séance choisis pour chaque patient' },
    { text: 'Questionnaire de suivi au délai de votre choix' },
    { text: 'Relance à 3, 6 ou 12 mois' },
  ] },
  { title: 'Piloter son cabinet', items: [
    { text: 'Ma rémunération : le virement à faire chaque mois', star: true },
    { text: 'Objectifs sur vos jours réellement travaillés', star: true },
    { text: 'Recettes, charges, immobilisations' },
    { text: 'Barème kilométrique, Madelin et PER' },
    { text: 'Simulateur « Et si mon activité changeait ? »' },
    { text: 'Statistiques : patientèle, motifs, chiffre d’affaires' },
    { text: 'Export CSV pour votre comptable' },
    { text: 'Multi-cabinet' },
    { text: 'Québec : TPS et TVQ' },
  ] },
  { title: 'Préparer sa journée', items: [
    { text: 'Ma journée : vos patients dans l’ordre de passage', star: true },
    { text: 'Tableau de bord « Aujourd’hui » et « À traiter »' },
    { text: 'Tableau de bord organisable' },
    { text: 'Météo dans l’accueil' },
  ] },
  { title: 'Fidéliser ses patients', items: [
    { text: 'Relance des patients non revus', star: true },
    { text: 'Messagerie patients avec pièces jointes' },
    { text: 'Diffusion à tous vos patients' },
    { text: 'Lien de prise de rendez-vous dans les relances' },
    { text: 'Canaux d’acquisition : qui vous recommande' },
  ] },
  { title: 'Travailler vite', items: [
    { text: 'Onglets patients', star: true },
    { text: 'Palette Ctrl + K', star: true },
    { text: 'Recherche par nom, téléphone, email ou date de naissance' },
    { text: 'Création rapide de patient, copier-coller depuis Doctolib' },
    { text: 'Thème clair et sombre' },
  ] },
  { title: 'Continuer à se former', items: [
    { text: 'E-learning intégré, avec progression', star: true, tag: 'OsteoUpgrade' },
    { text: 'OsteoFlash : révision par flashcards', tag: 'OsteoUpgrade' },
    { text: 'Revue de littérature mensuelle', tag: 'OsteoUpgrade' },
    { text: 'Vidéo de pratique', tag: 'OsteoUpgrade' },
  ] },
  { title: 'Garder la maîtrise de ses données', items: [
    { text: 'Dossiers sur votre ordinateur, pas sur un serveur', star: true },
    { text: 'Code PIN et verrouillage automatique' },
    { text: 'Sauvegarde en un clic et rappel' },
    { text: 'RGPD : export, suppression, journal d’activité' },
    { text: 'Import de patients depuis un fichier CSV' },
  ] },
]

export default function LandingPage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tarifAnnuel, setTarifAnnuel] = useState(false)
  const [ouTab, setOuTab] = useState(0)
  const [openGroup, setOpenGroup] = useState(0)

  const pricing = useScrollReveal()
  const partners = useScrollReveal()
  const cta = useScrollReveal()

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const navItems = [
    { label: 'Clinique', id: 'clinique' },
    { label: 'Exercices', id: 'exercices' },
    { label: 'Pilotage', id: 'pilotage' },
    { label: 'OsteoUpgrade', id: 'osteoupgrade' },
    { label: 'Tarifs', id: 'pricing' },
  ]

  // Partenaires de formation
  const partnersList = [
    {
      name: 'IFCOPS',
      fullName: 'Institut de Formation Continue pour Ostéopathes et Professionnels de santé',
      desc: 'Formations continues certifiées Qualiopi pour ostéopathes et professionnels de santé.',
      url: 'https://www.ifcops.com/',
      logo: '/landing/partners/ifcops.svg',
      perk: '-10% pendant 1 an pour les personnes ayant suivi une formation IFCOPS',
    },
  ]

  const ou = OU_TABS[ouTab]

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 overflow-x-hidden">

      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        {/* Bandeau offre étudiant : visible sur toute la page, la barre étant fixe. */}
        <button
          type="button"
          onClick={() => { setTarifAnnuel(true); scrollTo('etudiants') }}
          className="block w-full bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-xs sm:text-sm font-semibold px-4 py-2 text-center"
        >
          <GraduationCap className="inline h-4 w-4 -mt-0.5 mr-1.5" />
          &Eacute;tudiants et jeunes dipl&ocirc;m&eacute;s : -{STUDENT_DISCOUNT_PERCENT}&nbsp;% la premi&egrave;re ann&eacute;e sur l&apos;abonnement annuel
          <span className="underline underline-offset-2 ml-2">En profiter</span>
        </button>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            <BrandLockup className="text-base sm:text-lg" />

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/auth')}
                className="hidden sm:inline-flex text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push('/auth')}
                className="flow-gradient text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-sm hover:shadow-md"
              >
                Essai gratuit
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 -mr-2"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); router.push('/auth') }}
              className="block w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Se connecter
            </button>
          </div>
        )}
      </nav>


      {/* ─── PROMESSE ─── */}
      <section className="relative bg-[#0B1220] text-white pt-40 lg:pt-44 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-6">
          <span className="text-sm font-semibold text-sky-200 border border-sky-200/30 rounded-full px-4 py-1.5">
            Pour les ostéopathes, étiopathes et chiropracteurs
          </span>
          <h1 className="max-w-4xl text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
            Vous soignez. MyOsteoflow prend les notes, repère les alertes et fait le reste.
          </h1>
          <p className="max-w-3xl text-lg lg:text-xl leading-relaxed text-slate-300">
            L’anamnèse se rédige pendant que vous parlez, les drapeaux rouges sont signalés, les hypothèses vous aident à trancher.
            Après la séance, le courrier est écrit, les exercices sont sur le téléphone du patient, et vous savez ce que vous pouvez vous verser.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => router.push('/auth')}
              className="group flow-gradient text-white px-7 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 inline-flex items-center justify-center gap-2"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => scrollTo('clinique')}
              className="text-white border border-white/25 px-7 py-4 rounded-xl font-semibold text-base hover:bg-white/5 transition-all"
            >
              Voir comment ça marche
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2.5 mt-1">
            {[
              ['Notes par IA', 'clinique'],
              ['Drapeaux rouges', 'clinique'],
              ['Hypothèses cliniques', 'clinique'],
              ['Courriers', 'courriers'],
              ['Exercices et appli patient', 'exercices'],
              ['Objectifs et rémunération', 'pilotage'],
            ].map(([label, id]) => (
              <button
                key={label}
                onClick={() => scrollTo(id)}
                className="text-sm font-semibold text-slate-200 bg-white/5 border border-white/15 rounded-full px-3.5 py-2 hover:bg-white/10 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          {/* Aperçu en vidéo : recherche d'un patient, dictée structurée, drapeaux rouges, hypothèses */}
          <div className="w-full max-w-5xl mt-8 rounded-t-2xl overflow-hidden bg-white shadow-2xl shadow-black/40 ring-1 ring-white/10">
            <div className="flex items-center gap-2 h-8 px-4 bg-slate-100 border-b border-slate-200" aria-hidden="true">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <DemoVideo
              src="/landing/v2/apercu.mp4"
              poster="/landing/v2/poster-apercu.webp"
              label="Aperçu de MyOsteoflow : recherche d’un patient, dictée de l’anamnèse structurée, drapeaux rouges et hypothèses cliniques"
              className="block w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* ─── PENDANT LA SÉANCE ─── */}
      <section id="clinique" className="scroll-mt-28 py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col gap-20 lg:gap-24">
          <Reveal className="text-center flex flex-col items-center gap-3">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Pendant la séance</p>
            <h2 className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Un deuxième regard clinique, pendant que vous écoutez le patient.
            </h2>
          </Reveal>

          <Reveal className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 flex flex-col gap-4">
              <span className="text-sm font-bold text-blue-600">Prise de notes par IA</span>
              <h3 className="text-3xl font-extrabold tracking-tight">Dictez. L’anamnèse se range toute seule.</h3>
              <p className="text-lg leading-relaxed text-slate-600">
                Parlez comme d’habitude : histoire, douleur, facteurs modulants, antécédents, traitements, retentissement.
                Tout arrive classé, en style télégraphique, prêt à relire.
              </p>
              <ul className="flex flex-col gap-3 text-slate-700">
                {[
                  'Les antécédents repérés dans la dictée vous sont proposés un par un, à valider',
                  'Ce que vous n’avez pas abordé est signalé : rien ne manque au dossier',
                  'Reconnexion automatique si le réseau coupe pendant la dictée',
                ].map((t) => <li key={t} className="flex gap-2.5"><Check />{t}</li>)}
              </ul>
            </div>
            <figure className="flex-1 w-full flex flex-col gap-2.5">
              <DemoVideo
                src="/landing/v2/dictee-ia.mp4"
                poster="/landing/v2/poster-dictee.webp"
                label="Démonstration : dictée de l’anamnèse, structuration, drapeaux rouges et hypothèses cliniques"
                className="w-full rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 bg-[#0B1220]"
              />
              <figcaption className="text-sm text-slate-500">De la dictée aux hypothèses, en 40 secondes. Démonstration avec un patient fictif.</figcaption>
            </figure>
          </Reveal>

          <Reveal className="rounded-3xl bg-red-50 border border-red-200 p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1 flex flex-col gap-4">
              <span className="text-sm font-bold text-red-700">Dépistage actif des drapeaux rouges</span>
              <h3 className="text-3xl font-extrabold tracking-tight">Les signes d’alerte ne passent plus inaperçus.</h3>
              <p className="text-lg leading-relaxed text-red-950/80">
                À chaque anamnèse, l’IA passe en revue les signaux qui imposent de réorienter, même quand le patient les évoque en passant.
                Et ce que vous n’avez pas demandé est signalé.
              </p>
              <div className="flex flex-wrap gap-2">
                {RED_FLAGS.map((f) => (
                  <span key={f} className="text-sm font-medium text-red-800 bg-white border border-red-300 rounded-full px-3 py-1.5">{f}</span>
                ))}
              </div>
            </div>
            <Image
              src="/landing/v2/drapeaux-rouges.webp"
              alt="Carte Drapeaux rouges : douleur nocturne, âge supérieur à 55 ans, perte de poids à demander"
              width={1132}
              height={256}
              className="flex-1 w-full max-w-xl h-auto rounded-2xl shadow-xl shadow-red-900/15"
            />
          </Reveal>

          <Reveal className="flex flex-col-reverse lg:flex-row items-center gap-12">
            <Image
              src="/landing/v2/hypotheses.webp"
              alt="Hypothèses cliniques avec probabilités, questions à poser et tests à réaliser"
              width={1132}
              height={1660}
              className="flex-1 w-full max-w-lg h-auto rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10"
            />
            <div className="flex-1 flex flex-col gap-4">
              <span className="text-sm font-bold text-violet-700">Hypothèses cliniques</span>
              <h3 className="text-3xl font-extrabold tracking-tight">Un doute ? Les hypothèses, et les tests pour trancher.</h3>
              <p className="text-lg leading-relaxed text-slate-600">
                À partir de l’anamnèse, MyOsteoflow propose les hypothèses les plus probables, les questions à poser et les tests à réaliser.
                Cochez un résultat : le classement se met à jour sous vos yeux.
              </p>
              <ul className="flex flex-col gap-3 text-slate-700">
                {[
                  'Hypothèses classées avec leur probabilité et leur justification',
                  'Questions à poser au patient, dont chaque réponse compte',
                  'Tests à réaliser, liés à l’hypothèse qu’ils départagent',
                ].map((t) => <li key={t} className="flex gap-2.5"><Check tone="violet" />{t}</li>)}
              </ul>
              <p className="text-sm text-slate-500">Aide à la décision indicative : l’examen et la décision restent les vôtres.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── COURRIERS ─── */}
      <section id="courriers" className="scroll-mt-28 py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <Reveal className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col gap-4">
            <span className="text-sm font-bold text-blue-600">Courriers rédigés pour vous</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">Le courrier au médecin s’écrit à partir de la séance.</h2>
            <p className="text-lg leading-relaxed text-slate-600">
              Choisissez le patient et la consultation : le courrier reprend le motif, l’examen, les drapeaux rouges et vos conclusions,
              avec le ton qui convient entre confrères.
            </p>
            <ul className="flex flex-col gap-3 text-slate-700">
              {[
                'Courrier d’adressage à un médecin ou à un confrère',
                'Attestation de consultation',
                'Texte modifiable, puis PDF avec votre en-tête et votre tampon',
              ].map((t) => <li key={t} className="flex gap-2.5"><Check />{t}</li>)}
            </ul>
          </div>
          <div className="flex-1 w-full flex justify-center">
            <Image
              src="/landing/v2/courrier.webp"
              alt="Courrier d’adressage généré : patient, motif, drapeaux rouges, examen, demande de bilan"
              width={1200}
              height={985}
              className="w-full max-w-xl h-auto bg-white rounded-md shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5 -rotate-1"
            />
          </div>
        </Reveal>
      </section>

      {/* ─── EXERCICES ET APPLI PATIENT ─── */}
      <section id="exercices" className="scroll-mt-28 py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-[#0F2A26] text-white">
        <div className="max-w-6xl mx-auto flex flex-col gap-14">
          <Reveal className="max-w-3xl flex flex-col gap-3">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-300">Exercices et appli patient</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">Des exercices que vos patients font vraiment.</h2>
            <p className="text-lg leading-relaxed text-emerald-50/80">
              Le programme part sur le téléphone du patient, sans compte ni appli à installer.
              Il est guidé à chaque séance, et vous retrouvez son suivi à la consultation suivante.
            </p>
          </Reveal>
          <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {APP_STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col gap-5">
                <div className="flex justify-center bg-white/[0.04] rounded-3xl pt-7 h-[440px] lg:h-[500px] overflow-hidden">
                  <Image
                    src={step.img}
                    alt={step.alt}
                    width={780}
                    height={1328}
                    className="w-[230px] lg:w-[260px] h-auto self-start rounded-t-[28px] ring-8 ring-[#1F3D38] shadow-2xl shadow-black/50"
                  />
                </div>
                <div className="flex gap-3.5">
                  <span className="flex-none w-9 h-9 rounded-full bg-emerald-400 text-[#0F2A26] flex items-center justify-center font-extrabold">{index + 1}</span>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xl font-bold">{step.title}</span>
                    <span className="text-base leading-relaxed text-emerald-50/80">{step.text}</span>
                  </div>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ─── PILOTAGE ─── */}
      <section id="pilotage" className="scroll-mt-28 py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col gap-12">
          <Reveal className="text-center flex flex-col items-center gap-3">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Pilotage du cabinet</p>
            <h2 className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Savoir où vous en êtes. Et combien vous pouvez vous verser.
            </h2>
          </Reveal>
          <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <article className="flex flex-col gap-5">
              <Image src="/landing/v2/objectifs.webp" alt="Objectifs : trajectoire annuelle, avance sur l’objectif, projection de fin d’année" width={1600} height={793} className="w-full h-auto rounded-2xl shadow-2xl shadow-slate-900/15" />
              <h3 className="text-2xl font-extrabold tracking-tight">Objectifs : en avance ou en retard, au jour près</h3>
              <p className="text-base lg:text-lg leading-relaxed text-slate-600">
                Fixez votre chiffre d’affaires annuel : MyOsteoflow le traduit en objectif du jour, de la semaine et du mois,
                sur vos jours réellement travaillés et vos congés, avec une projection de fin d’année.
              </p>
            </article>
            <article className="flex flex-col gap-5">
              <Image src="/landing/v2/remuneration.webp" alt="Ma rémunération : virement vers le compte perso, net dans votre poche, détail du mois" width={1600} height={1321} className="w-full h-auto rounded-2xl shadow-2xl shadow-slate-900/15" />
              <h3 className="text-2xl font-extrabold tracking-tight">Ma rémunération : le virement à faire, chaque mois</h3>
              <p className="text-base lg:text-lg leading-relaxed text-slate-600">
                Encaissements, charges, Urssaf, impôt et marge de sécurité : vous savez ce que vous pouvez virer sur votre compte perso,
                et ce qui doit rester de côté. Micro-BNC ou déclaration contrôlée, avec un simulateur pour tester l’effet d’un changement d’activité.
              </p>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ─── LE RESTE EN UN CLIC ─── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <Reveal className="max-w-3xl flex flex-col gap-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">Et tout le reste se fait en un clic.</h2>
            <p className="text-lg text-slate-600">Pensé pour enchaîner les patients sans chercher où cliquer.</p>
          </Reveal>
          <Reveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="md:col-span-2 lg:row-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
              <DemoVideo
                src="/landing/v2/palette-ctrl-k.mp4"
                poster="/landing/v2/poster-palette.webp"
                label="Démonstration : Ctrl + K, recherche d’un patient, ouverture d’une consultation"
                className="w-full bg-[#0B1220]"
              />
              <div className="p-6 lg:p-7 flex flex-col gap-2">
                <h3 className="text-xl font-bold">Ctrl + K, onglets patients, Ma journée</h3>
                <p className="text-slate-600 leading-relaxed">
                  Un patient et son action en trois touches, plusieurs dossiers ouverts en onglets, vos patients du jour dans l’ordre de passage.
                </p>
              </div>
            </article>
            {DAILY.map((card) => (
              <article key={card.title} className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col justify-center gap-2.5">
                <h3 className="text-lg font-bold">{card.title}</h3>
                <p className="text-slate-600 leading-relaxed">{card.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ─── OSTEOUPGRADE ─── */}
      <section id="osteoupgrade" className="scroll-mt-28 py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-sky-50 border-y border-sky-200">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <Reveal className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl flex flex-col gap-3">
              <p className="text-sm font-bold uppercase tracking-wider text-sky-700">OsteoUpgrade</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-sky-950">
                Une clinique à jour, sans y passer vos soirées.
              </h2>
              <p className="text-lg leading-relaxed text-slate-700">
                Formations, tests, techniques en vidéo et littérature synthétisée : tout ce qui fait progresser votre pratique,
                pensé par des cliniciens, et accessible depuis MyOsteoflow jusque dans la consultation.
              </p>
            </div>
            <button
              onClick={() => scrollTo('pricing')}
              className="flex-none self-start lg:self-auto bg-sky-700 hover:bg-sky-800 text-white px-6 py-3.5 rounded-xl font-bold transition-colors"
            >
              Voir l’offre complète
            </button>
          </Reveal>

          <Reveal className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {OU_STATS.map((st) => (
              <div key={st.label} className="bg-white border border-sky-200 rounded-2xl px-5 py-4 flex flex-col gap-1">
                <span className="text-3xl font-extrabold tracking-tight text-sky-700">{st.value}</span>
                <span className="text-sm leading-snug text-slate-600">{st.label}</span>
              </div>
            ))}
          </Reveal>

          <Reveal className="bg-white border border-sky-200 rounded-3xl overflow-hidden shadow-2xl shadow-sky-900/10">
            <div role="tablist" aria-label="Contenus OsteoUpgrade" className="flex flex-wrap gap-1.5 p-3 border-b border-sky-100 bg-sky-50/50">
              {OU_TABS.map((tab, index) => (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  aria-selected={ouTab === index}
                  onClick={() => setOuTab(index)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${ouTab === index ? 'bg-sky-700 text-white' : 'text-sky-900 hover:bg-sky-100'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="flex flex-col lg:flex-row gap-8 p-6 lg:p-8 items-center">
              <div className="lg:w-[340px] flex-none flex flex-col gap-3.5">
                <h3 className="text-2xl font-extrabold tracking-tight text-sky-950">{ou.title}</h3>
                <p className="text-slate-600 leading-relaxed">{ou.text}</p>
                <ul className="flex flex-col gap-2.5 text-sm text-slate-700">
                  {ou.points.map((pt) => <li key={pt} className="flex gap-2.5"><Check tone="sky" />{pt}</li>)}
                </ul>
              </div>
              <Image key={ou.img} src={ou.img} alt={ou.alt} width={ou.w} height={ou.h} className="flex-1 w-full min-w-0 h-auto rounded-xl border border-slate-200" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CONFIANCE ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0B1220] text-white">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <h2 className="text-3xl font-extrabold tracking-tight">Vos dossiers restent chez vous.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST.map((t) => (
              <div key={t.title} className="flex flex-col gap-2 border-t-2 border-sky-400 pt-4">
                <t.icon className="h-5 w-5 text-sky-300" />
                <span className="text-lg font-bold">{t.title}</span>
                <span className="text-sm leading-relaxed text-slate-300">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TOUTES LES FONCTIONNALITÉS ─── */}
      <section id="fonctionnalites" className="scroll-mt-28 py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Toutes les fonctionnalités</h2>
            <p className="text-lg text-slate-600">Rangées selon votre journée. Cliquez sur un moment pour le déplier.</p>
          </div>
          <div className="border-t border-slate-200">
            {ALL_FEATURES.map((group, index) => {
              const open = openGroup === index
              return (
                <div key={group.title} className="border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(open ? -1 : index)}
                    aria-expanded={open}
                    className="w-full flex items-center gap-4 py-5 px-1 text-left"
                  >
                    <span className="w-7 text-sm font-bold text-blue-600">{String(index + 1).padStart(2, '0')}</span>
                    <span className="flex-1 text-lg sm:text-xl font-bold">{group.title}</span>
                    <span className="hidden sm:inline text-sm text-slate-500">{group.items.length} fonctionnalités</span>
                    {open ? <Minus className="h-5 w-5 text-slate-500" /> : <Plus className="h-5 w-5 text-slate-500" />}
                  </button>
                  {open && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 pb-6 pl-12">
                      {group.items.map((it) => (
                        <li key={it.text} className="flex gap-2.5 text-slate-700 leading-relaxed">
                          <span className={`mt-2.5 h-1.5 w-1.5 flex-none rounded-full ${it.star ? 'bg-blue-600' : 'bg-slate-400'}`} aria-hidden="true" />
                          <span>
                            <span className={it.star ? 'font-semibold' : ''}>{it.text}</span>
                            {it.tag && <span className="ml-1.5 text-xs font-semibold text-sky-700">{it.tag}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── TARIFS ─── */}
      <section id="pricing" ref={pricing.ref} className="scroll-mt-28 py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">

        <div className="relative max-w-6xl mx-auto">
          <div className={`text-center mb-14 transition-all duration-700 ${
            pricing.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 border border-sky-200 px-4 py-2 rounded-full text-sm font-bold mb-6 uppercase tracking-wider">
              <Crown className="h-4 w-4" />
              Tarifs
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
              Prenez ce dont vous avez besoin.
              <br />
              <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                {tarifAnnuel
                  ? <>&Agrave; partir de {formatAmount(Math.min(...OFFERS.map((o) => o.annualAmount)))}/an, deux mois offerts.</>
                  : <>&Agrave; partir de {formatAmount(2999)}/mois, sans engagement.</>}
              </span>
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto">
              Le logiciel de cabinet, la plateforme de formation, ou les deux,
              r&eacute;unis avec {BUNDLE_SAVING.savedPercent}&nbsp;% de remise.
            </p>
          </div>

          <div className={`transition-all duration-700 delay-100 ${
            pricing.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Mensuel ou annuel */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex rounded-xl bg-white border border-slate-200 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setTarifAnnuel(false)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${!tarifAnnuel ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setTarifAnnuel(true)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tarifAnnuel ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Annuel <span className={tarifAnnuel ? 'text-emerald-300' : 'text-emerald-600'}>2 mois offerts</span>
                </button>
              </div>
            </div>

            {/* Offre étudiant */}
            <div id="etudiants" className="scroll-mt-32 mb-10 rounded-2xl bg-indigo-600 text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/20">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-3">
                    <GraduationCap className="h-4 w-4" />
                    Offre &eacute;tudiant
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    -{STUDENT_DISCOUNT_PERCENT}&nbsp;% la premi&egrave;re ann&eacute;e sur l&apos;abonnement annuel
                  </h3>
                  <p className="text-sm text-indigo-100">
                    Pour les &eacute;tudiants et jeunes dipl&ocirc;m&eacute;s, sur justificatif (carte &eacute;tudiante,
                    certificat de scolarit&eacute;, dipl&ocirc;me ou avis de situation INSEE). Le tarif est d&eacute;bloqu&eacute;
                    d&egrave;s l&apos;envoi du justificatif, puis l&apos;abonnement se poursuit au tarif annuel.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 lg:w-[420px]">
                  {OFFERS.map((o) => (
                    <div key={o.id} className="rounded-xl bg-white/10 px-3 py-3 text-center">
                      <p className="text-xs text-indigo-100">{o.name}</p>
                      <p className="text-lg font-bold">{formatAmount(studentFirstYearAmount(o))}</p>
                      <p className="text-[11px] text-indigo-200 line-through">{formatAmount(o.annualAmount)}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/auth?etudiant=1')}
                  className="lg:self-center inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50 transition-colors"
                >
                  J&apos;en profite
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {OFFERS.map((offer) => (
                <div
                  key={offer.id}
                  className={`relative rounded-2xl p-8 flex flex-col transition-all ${
                    offer.highlighted
                      ? 'bg-white ring-2 ring-sky-500 shadow-xl lg:-mt-4 lg:pb-12'
                      : 'bg-white border border-slate-200 hover:shadow-lg'
                  }`}
                >
                  {offer.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                        <Crown className="h-3.5 w-3.5" />
                        Recommand&eacute; &middot; -{BUNDLE_SAVING.savedPercent}&nbsp;%
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`text-sm font-semibold uppercase tracking-wider mb-2 ${offer.highlighted ? 'text-sky-600' : 'text-slate-500'}`}>
                      {offer.name}
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-bold text-slate-900">
                        {formatAmount(tarifAnnuel ? offer.annualAmount : offer.monthlyAmount)}
                      </span>
                      <span className="text-slate-400 text-sm">{tarifAnnuel ? '/an' : '/mois'}</span>
                    </div>
                    {tarifAnnuel ? (
                      <p className="text-xs text-emerald-600 font-semibold">
                        {annualSavingOf(offer).freeMonths} mois offerts &middot; au lieu de {formatAmount(annualSavingOf(offer).twelveMonthsAmount)}/an
                      </p>
                    ) : null}
                    {!tarifAnnuel && (
                      <p className="text-xs text-slate-400">Sans engagement &middot; annulable &agrave; tout moment</p>
                    )}
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5 inline-flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      &Eacute;tudiant : {formatAmount(studentFirstYearAmount(offer))} la 1re ann&eacute;e en annuel
                    </p>
                    {offer.highlighted && !tarifAnnuel && (
                      <p className="text-xs text-emerald-600 font-semibold mt-1">
                        {formatAmount(BUNDLE_SAVING.savedAmount)}/mois &eacute;conomis&eacute;s vs les deux offres s&eacute;par&eacute;es
                      </p>
                    )}
                    <p className="text-sm text-slate-500 mt-3 min-h-[40px]">{offer.tagline}</p>
                  </div>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {offer.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
                        <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${offer.highlighted ? 'text-sky-500' : 'text-slate-400'}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    // L'offre choisie (mensuelle ou annuelle) est transmise à
                    // l'inscription : le visiteur part ensuite directement au
                    // paiement de ce tarif.
                    onClick={() => router.push(`/auth?plan=${tarifAnnuel ? offer.annualPlanType : offer.planType}`)}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                      offer.highlighted
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-sky-500/20'
                        : 'border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Choisir {offer.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Essai + gratuit */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <div className="rounded-2xl bg-white border border-slate-200 p-6 flex items-start gap-3">
                <Gift className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">7 jours d&apos;essai gratuit</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Sur l&apos;offre de votre choix, avec un acc&egrave;s complet. Carte requise, annulable avant la fin de l&apos;essai.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-6 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-sm">Ou d&eacute;couvrez gratuitement</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Le module &eacute;paule complet reste accessible sans carte bancaire.{' '}
                    <button onClick={() => router.push('/auth')} className="text-sky-600 font-semibold hover:underline">
                      Cr&eacute;er un compte
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-400">
                {tarifAnnuel
                  ? 'Prélevé une fois par an. Résiliable à tout moment depuis votre compte, effectif à la fin de l’année en cours. Déductible des frais professionnels.'
                  : 'Sans engagement. Annulable à tout moment depuis votre compte. Déductible des frais professionnels.'}
                {' '}Changement d&apos;offre possible à tout moment, avec prorata automatique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section ref={cta.ref} className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[#0B1220]" />

        <div className={`relative max-w-3xl mx-auto text-center transition-all duration-700 ${
          cta.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            Votre prochaine séance,
            <br />
            l’esprit libre.
          </h2>
          <p className="text-lg text-slate-400 mb-4 max-w-lg mx-auto">
            MyOsteoflow pour gérer, OsteoUpgrade pour progresser.
            Séparément à {formatAmount(2999)}/mois, ou réunis à {formatAmount(4999)}/mois.
            <br />
            Deux mois offerts en formule annuelle.
          </p>
          <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto">
            Commencez gratuitement avec le module épaule. Sans carte bancaire.
            <br />
            <span className="text-indigo-300 font-semibold">
              Étudiant ou jeune diplômé : -{STUDENT_DISCOUNT_PERCENT} % la première année sur l&apos;annuel.
            </span>
          </p>
          <button
            onClick={() => router.push('/auth')}
            className="group flow-gradient text-white px-10 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 inline-flex items-center gap-3"
          >
            Commencer maintenant
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* ─── PARTENAIRES ─── */}
      <section id="partenaires" ref={partners.ref} className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-12 transition-all duration-700 ${
            partners.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
              Ils nous font confiance
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Nos partenaires
            </h2>
          </div>

          <div className={`flex flex-wrap items-stretch justify-center gap-5 transition-all duration-700 delay-100 ${
            partners.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {partnersList.map((partner) => (
              <a
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all max-w-md"
              >
                <div className="relative flex-shrink-0 w-24 h-16 rounded-xl bg-slate-50 flex items-center justify-center p-2">
                  <Image
                    src={partner.logo}
                    alt={`Logo ${partner.name}`}
                    width={80}
                    height={48}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-base font-bold text-slate-900">
                    {partner.name}
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{partner.desc}</p>
                  {partner.perk && (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                      <Gift className="h-3 w-3" />
                      {partner.perk}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <PublicFooter />
    </div>
  )
}
