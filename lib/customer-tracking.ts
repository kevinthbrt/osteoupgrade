/**
 * Suivi client : vocabulaire commun au module /admin/clients.
 *
 * Ce fichier est volontairement sans dépendance (pas de client Supabase, pas
 * de Stripe), comme `lib/entitlements.ts` : la page admin est un composant
 * client et doit pouvoir importer ces libellés sans embarquer la clé
 * service-role. Les écritures en base vivent dans `lib/customer-events.ts`.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || 'https://www.osteo-upgrade.fr'

// ── Étapes du cycle de vie ─────────────────────────────────────────────────

export const LIFECYCLE_STAGES = [
  'inscrit',
  'essai_en_cours',
  'essai_termine',
  'abonne',
  'impaye',
  'resilie',
  'admin',
] as const

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number]

/**
 * Libellé et couleur d'une étape.
 *
 * `essai_termine` désigne un compte qui a consommé son essai sans jamais
 * s'abonner ensuite, et sans que la chronologie porte de résiliation : c'est
 * la cible naturelle d'une relance « pourquoi ne pas avoir continué ? ».
 */
export const LIFECYCLE_LABELS: Record<LifecycleStage, { label: string; classes: string }> = {
  inscrit:        { label: 'Inscrit',        classes: 'bg-slate-100 text-slate-700' },
  essai_en_cours: { label: 'Essai en cours', classes: 'bg-blue-100 text-blue-800' },
  essai_termine:  { label: 'Essai terminé',  classes: 'bg-amber-100 text-amber-800' },
  abonne:         { label: 'Abonné',         classes: 'bg-emerald-100 text-emerald-800' },
  impaye:         { label: 'Impayé',         classes: 'bg-orange-100 text-orange-800' },
  resilie:        { label: 'Résilié',        classes: 'bg-red-100 text-red-700' },
  admin:          { label: 'Admin',          classes: 'bg-purple-100 text-purple-800' },
}

export function lifecycleLabel(stage: string | null | undefined) {
  return LIFECYCLE_LABELS[(stage as LifecycleStage)] ?? { label: stage || 'Inconnu', classes: 'bg-slate-100 text-slate-600' }
}

// ── Chronologie ────────────────────────────────────────────────────────────

export const CUSTOMER_EVENT_TYPES = [
  'signup',
  'trial_started',
  'trial_canceled',
  'trial_converted',
  'subscribed',
  'plan_changed',
  'renewed',
  'payment_failed',
  'canceled',
  'reactivated',
  'founding_granted',
  'survey_sent',
  'survey_answered',
  'admin_email',
  'note',
  'other',
] as const

export type CustomerEventType = (typeof CUSTOMER_EVENT_TYPES)[number]

export const EVENT_LABELS: Record<CustomerEventType, string> = {
  signup: 'Inscription',
  trial_started: 'Essai gratuit démarré',
  trial_canceled: 'Essai annulé',
  trial_converted: 'Essai converti en abonnement',
  subscribed: 'Abonnement souscrit',
  plan_changed: "Changement d'offre",
  renewed: 'Renouvellement encaissé',
  payment_failed: 'Paiement échoué',
  canceled: 'Résiliation',
  reactivated: 'Réabonnement',
  founding_granted: 'Statut Fondateur accordé',
  survey_sent: 'Enquête envoyée',
  survey_answered: 'Réponse à une enquête',
  admin_email: 'Email envoyé depuis la fiche',
  note: 'Note interne',
  other: 'Événement',
}

/**
 * Motifs de résiliation du portail client Stripe.
 *
 * Stripe les collecte au moment où le client clique sur « résilier ». Ils
 * n'étaient jusqu'ici lus que dans la notification envoyée à l'administrateur,
 * puis perdus : ils sont désormais stockés sur l'événement `canceled`.
 */
export const CHURN_REASONS: Record<string, string> = {
  too_expensive: 'Trop cher',
  switched_service: 'Parti chez un concurrent',
  unused: "Ne s'en servait pas",
  customer_service: 'Service client',
  too_complex: 'Trop compliqué',
  low_quality: 'Qualité insuffisante',
  missing_features: 'Fonctionnalités manquantes',
  other: 'Autre',
}

export function churnReasonLabel(reason: string | null | undefined): string | null {
  if (!reason) return null
  return CHURN_REASONS[reason] ?? reason
}

// ── Emails envoyés depuis la fiche ─────────────────────────────────────────

export const EMAIL_CATEGORIES = ['relance', 'enquete', 'onboarding', 'offre', 'support', 'autre'] as const
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number]

export const EMAIL_CATEGORY_LABELS: Record<EmailCategory, string> = {
  relance: 'Relance',
  enquete: 'Enquête',
  onboarding: 'Prise en main',
  offre: 'Offre commerciale',
  support: 'Support',
  autre: 'Autre',
}

export const EMAIL_STATUS_LABELS: Record<string, { label: string; classes: string }> = {
  sent:       { label: 'Envoyé',      classes: 'bg-slate-100 text-slate-600' },
  delivered:  { label: 'Délivré',     classes: 'bg-sky-100 text-sky-700' },
  opened:     { label: 'Ouvert',      classes: 'bg-emerald-100 text-emerald-700' },
  clicked:    { label: 'Cliqué',      classes: 'bg-violet-100 text-violet-700' },
  bounced:    { label: 'Rejeté',      classes: 'bg-red-100 text-red-700' },
  complained: { label: 'Spam',        classes: 'bg-red-100 text-red-700' },
  failed:     { label: "Échec d'envoi", classes: 'bg-red-100 text-red-700' },
}

// ── Actions consignées à la main ───────────────────────────────────────────

export const CANAUX_CONTACT = ['email', 'appel', 'message', 'reponse', 'autre'] as const
export type CanalContact = (typeof CANAUX_CONTACT)[number]

/**
 * Ce qu'on peut inscrire dans la chronologie sans que le module l'ait fait.
 *
 * Le rattrapage de la migration a reconstitué les dates que `profiles`
 * portait encore, mais rien de ce qui s'est passé en dehors de l'application :
 * un email envoyé depuis votre boîte, un appel, une réponse reçue ailleurs.
 * Sans moyen de les consigner, la fiche affirme « jamais relancé » d'une
 * personne relancée trois fois, ce qui est pire qu'une fiche vide.
 */
export const CANAL_LABELS: Record<CanalContact, { label: string; description: string; emoji: string }> = {
  email: {
    label: 'Email envoyé',
    description: 'Message parti de votre boîte, hors du module. Compte comme une relance.',
    emoji: '✉️',
  },
  appel: {
    label: 'Appel téléphonique',
    description: 'Échange de vive voix.',
    emoji: '📞',
  },
  message: {
    label: 'Message',
    description: 'SMS, WhatsApp, réseau social.',
    emoji: '💬',
  },
  reponse: {
    label: 'Réponse reçue',
    description: 'La personne vous a répondu, par un canal que le module ne voit pas.',
    emoji: '📥',
  },
  autre: {
    label: 'Autre contact',
    description: 'Rencontre en formation, salon, recommandation.',
    emoji: '🤝',
  },
}

// ── Enquêtes ───────────────────────────────────────────────────────────────

export const SURVEY_KINDS = [
  'pourquoi_pas_abonne',
  'pourquoi_essai_annule',
  'pourquoi_resiliation',
  'satisfaction',
  'autre',
] as const

export type SurveyKind = (typeof SURVEY_KINDS)[number]

export type SurveyDefinition = {
  /** Libellé dans l'admin. */
  label: string
  /** Étapes du cycle de vie auxquelles cette enquête s'adresse. */
  cible: LifecycleStage[]
  /** Question posée sur la page de réponse. */
  question: string
  /** Sujet de l'email d'invitation. */
  subject: string
  /** Phrase d'accroche de l'email. */
  intro: string
  /** Motifs proposés. Vide : question purement ouverte. */
  choices: string[]
  /** Demander une note de 1 à 5 en plus du texte libre. */
  askRating: boolean
}

/**
 * Les quatre questions qui manquaient.
 *
 * Chacune vise une étape précise : demander « pourquoi êtes-vous parti ? » à
 * quelqu'un qui n'a jamais rien pris n'appelle aucune réponse utile, et
 * demander « qu'est-ce qui vous plaît ? » à un client qui vient de résilier
 * passe à côté du sujet. La cible est donc portée par la définition, et
 * l'admin propose par défaut l'enquête correspondant à la fiche ouverte.
 */
export const SURVEY_DEFINITIONS: Record<SurveyKind, SurveyDefinition> = {
  pourquoi_pas_abonne: {
    label: "Pourquoi ne pas s'être abonné",
    cible: ['inscrit'],
    question: "Qu'est-ce qui vous retient de vous abonner ?",
    subject: 'Une question rapide (30 secondes)',
    intro: "Vous avez créé un compte sur OsteoUpgrade, sans aller plus loin pour l'instant. Nous aimerions comprendre pourquoi : votre réponse oriente directement ce que nous construisons.",
    choices: [
      'Le prix',
      "Je n'ai pas encore eu le temps de tester",
      'Le contenu ne correspond pas à mes attentes',
      'Il manque une fonctionnalité qui me serait utile',
      "Je n'en ai pas l'usage dans ma pratique",
      'Autre raison',
    ],
    askRating: false,
  },
  pourquoi_essai_annule: {
    label: "Pourquoi l'essai a été annulé",
    cible: ['essai_termine'],
    question: 'Pourquoi avez-vous mis fin à votre essai gratuit ?',
    subject: 'Votre essai est terminé : dites-nous ce qui a manqué',
    intro: "Vous avez essayé MyOsteoFlow puis vous vous êtes arrêté là. Nous préférons le savoir que le deviner : qu'est-ce qui n'a pas fonctionné ?",
    choices: [
      'Le prix après la période gratuite',
      "L'outil ne correspond pas à ma façon de travailler",
      'La prise en main était trop compliquée',
      "Je n'ai pas eu le temps de m'en servir",
      'Il manquait des fonctionnalités',
      'Autre raison',
    ],
    askRating: false,
  },
  pourquoi_resiliation: {
    label: 'Pourquoi la résiliation',
    cible: ['resilie'],
    question: 'Pourquoi avez-vous résilié votre abonnement ?',
    subject: 'Deux minutes pour nous dire ce qui vous a fait partir',
    intro: "Vous avez mis fin à votre abonnement. Nous ne cherchons pas à vous faire revenir avec cet email : nous cherchons à comprendre, pour corriger ce qui doit l'être.",
    choices: [
      'Le prix',
      'Je ne m\'en servais plus assez',
      'Le contenu ne se renouvelait pas assez',
      'Des problèmes techniques',
      'Je suis parti chez un concurrent',
      'Autre raison',
    ],
    askRating: false,
  },
  satisfaction: {
    label: 'Satisfaction : ce qui plaît ou non',
    cible: ['abonne', 'essai_en_cours'],
    question: "Qu'est-ce qui vous plaît, et qu'est-ce qui vous manque ?",
    subject: 'Votre avis sur OsteoUpgrade',
    intro: "Vous utilisez OsteoUpgrade au quotidien : personne n'est mieux placé pour nous dire ce qui fonctionne et ce qui devrait changer.",
    choices: [],
    askRating: true,
  },
  autre: {
    label: 'Question libre',
    cible: [],
    question: 'Votre avis nous intéresse',
    subject: 'Une question',
    intro: 'Merci de prendre un instant pour nous répondre.',
    choices: [],
    askRating: false,
  },
}

export function surveyUrl(token: string): string {
  return `${BASE_URL}/avis/${token}`
}

/**
 * Enquête proposée par défaut pour une étape donnée. Renvoie `null` quand
 * aucune ne s'y prête (un admin, un compte en impayé qu'il faut appeler et
 * non sonder).
 */
export function suggestedSurvey(stage: string | null | undefined): SurveyKind | null {
  for (const kind of SURVEY_KINDS) {
    if (SURVEY_DEFINITIONS[kind].cible.includes(stage as LifecycleStage)) return kind
  }
  return null
}

// ── Gabarit d'email ────────────────────────────────────────────────────────

/**
 * Gabarit maison (cf. CLAUDE.md) : bandeau dégradé violet, corps blanc,
 * bouton d'action, pied de page gris. Le pied de désinscription est ajouté
 * séparément par `sendTransactionalEmail`, il ne doit pas figurer ici.
 */
export function emailShell(params: {
  emoji: string
  title: string
  subtitle?: string
  bodyHtml: string
  cta?: { label: string; url: string }
}): string {
  const { emoji, title, subtitle, bodyHtml, cta } = params

  const boutonHtml = cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px auto 8px;">
         <tr>
           <td style="border-radius: 8px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
             <a href="${cta.url}" style="display: inline-block; padding: 14px 32px; font-family: Inter, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">${cta.label}</a>
           </td>
         </tr>
       </table>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Inter, -apple-system, 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
              <div style="font-size: 32px; line-height: 1;">${emoji}</div>
              <h1 style="margin: 12px 0 0; font-size: 24px; font-weight: 700; color: #ffffff;">${title}</h1>
              ${subtitle ? `<p style="margin: 8px 0 0; font-size: 15px; color: rgba(255,255,255,0.85);">${subtitle}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; color: #374151; font-size: 15px; line-height: 1.65;">
              ${bodyHtml}
              ${boutonHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 6px;">L'équipe OsteoUpgrade × MyOsteoflow</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} OsteoUpgrade. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Encart lavande, pour mettre en avant une phrase dans le corps d'un email. */
export function emailCallout(html: string): string {
  return `<div style="background-color: #f5f3ff; border-radius: 8px; padding: 20px; margin: 24px 0;">${html}</div>`
}

/** Email d'invitation à répondre à une enquête. */
export function buildSurveyEmail(params: {
  kind: SurveyKind
  token: string
  prenom?: string | null
  question?: string | null
  message?: string | null
}): { subject: string; html: string } {
  const def = SURVEY_DEFINITIONS[params.kind]
  const question = params.question?.trim() || def.question
  const salutation = params.prenom ? `Bonjour ${escapeHtml(params.prenom)},` : 'Bonjour,'

  const corps = params.message?.trim()
    ? `<p style="margin: 0 0 16px;">${salutation}</p>${paragraphes(params.message)}`
    : `<p style="margin: 0 0 16px;">${salutation}</p><p style="margin: 0 0 16px;">${escapeHtml(def.intro)}</p>`

  const html = emailShell({
    emoji: '💬',
    title: def.subject,
    subtitle: 'Une seule question, moins de deux minutes',
    bodyHtml:
      corps +
      emailCallout(
        `<p style="margin: 0; font-size: 16px; font-weight: 600; color: #5b21b6;">${escapeHtml(question)}</p>`
      ) +
      `<p style="margin: 0; color: #6b7280; font-size: 14px;">Votre réponse reste entre nous et ne sera jamais publiée.</p>`,
    cta: { label: 'Répondre en un clic', url: surveyUrl(params.token) },
  })

  return { subject: def.subject, html }
}

/** Échappe le texte libre saisi dans l'admin avant insertion dans le HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Convertit un texte brut en paragraphes HTML, sauts de ligne compris. */
export function paragraphes(texte: string): string {
  return texte
    .split(/\n{2,}/)
    .map((bloc) => `<p style="margin: 0 0 16px;">${escapeHtml(bloc).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/**
 * Remplace les champs de fusion d'un message rédigé dans l'admin.
 * Volontairement limité à trois variables : au-delà, c'est une séquence
 * d'automatisation qu'il faut créer, pas un email à la main.
 */
export function fusionner(texte: string, valeurs: { prenom?: string | null; nom?: string | null; offre?: string | null }): string {
  return texte
    .replace(/\{\{\s*prenom\s*\}\}/gi, valeurs.prenom || '')
    .replace(/\{\{\s*nom\s*\}\}/gi, valeurs.nom || '')
    .replace(/\{\{\s*offre\s*\}\}/gi, valeurs.offre || '')
}

// ── Signaux d'action ───────────────────────────────────────────────────────

/**
 * Ce qui transforme une base de données en liste de travail.
 *
 * Le module savait tout d'un client sans jamais dire par où commencer. Un
 * signal répond à la seule question qui compte le matin : qui dois-je
 * contacter aujourd'hui, et pourquoi lui.
 *
 * Deux règles gouvernent leur conception, et elles comptent plus que la liste
 * elle-même :
 *
 *   1. Un signal a une fenêtre qui se referme. « L'essai finit dans trois
 *      jours » ne vaut que ces trois jours ; au-delà, ce n'est plus une
 *      relance mais un email de deuil. C'est la fenêtre qui crée l'urgence,
 *      pas la couleur du voyant.
 *
 *   2. Un signal s'éteint seul dès qu'un contact lui est postérieur. Aucun
 *      bouton « fait » à cliquer : entretenir une liste de tâches en plus du
 *      travail, personne ne le fait deux semaines de suite.
 *
 * Sans ces deux règles, vingt comptes sur trente-six brilleraient en
 * permanence, on cesserait de les regarder, et les voyants deviendraient du
 * papier peint. Un voyant toujours allumé n'est pas un voyant.
 */

export const SIGNAL_KEYS = [
  'essai_finit',
  'impaye',
  'resilie_a_interroger',
  'abonne_dormant',
  'essai_sans_relance',
  'inscrit_sans_relance',
  'reponse_sans_suite',
  'adresse_en_echec',
] as const

export type SignalKey = (typeof SIGNAL_KEYS)[number]

/** 1 est le plus urgent. Sert au tri de la file et à la couleur du voyant. */
export type Urgence = 1 | 2 | 3 | 4

export type Signal = {
  key: SignalKey
  urgence: Urgence
  label: string
  /** Pourquoi maintenant, en clair. C'est ce que lit l'admin, pas la clé. */
  raison: string
  /** Ce que propose le bouton de la file d'attente. */
  action: 'ecrire' | 'enquete' | 'corriger'
}

export const URGENCE_STYLES: Record<Urgence, { point: string; badge: string; libelle: string }> = {
  1: { point: 'bg-red-500',    badge: 'bg-red-100 text-red-800',       libelle: 'Urgent' },
  2: { point: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800', libelle: 'À faire' },
  3: { point: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-800',   libelle: 'Quand vous pouvez' },
  4: { point: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-600',   libelle: 'À corriger' },
}

/** Objet minimal attendu : une ligne de `admin_customer_overview`. */
type LigneClient = {
  lifecycle_stage?: string | null
  subscription_status?: string | null
  trial_ends_at?: string | null
  trial_used_at?: string | null
  trial_canceled_at?: string | null
  canceled_at?: string | null
  last_payment_failed_at?: string | null
  last_login_date?: string | null
  last_contact_at?: string | null
  last_answer_at?: string | null
  last_rating?: number | null
  surveys_sent?: number | null
  emails_sent?: number | null
  emails_failed?: number | null
  created_at?: string | null
}

const JOUR = 86400000

function tempsDe(valeur: string | null | undefined): number | null {
  if (!valeur) return null
  const t = new Date(valeur).getTime()
  return Number.isNaN(t) ? null : t
}

/**
 * Vrai si un contact a eu lieu depuis que le signal s'est allumé.
 *
 * C'est l'extinction automatique : elle regarde `last_contact_at`, qui agrège
 * les emails réellement partis ET les contacts consignés sur un autre canal.
 * Un appel passé hier éteint donc le voyant, comme un email envoyé hier.
 */
function contacteDepuis(client: LigneClient, declenchement: number | null): boolean {
  if (declenchement === null) return false
  const contact = tempsDe(client.last_contact_at)
  return contact !== null && contact >= declenchement
}

/**
 * Signaux actifs pour un client, du plus urgent au moins urgent.
 *
 * Fonction pure : la page l'appelle sur les lignes déjà chargées, la route
 * l'appelle pour compter. Un seul endroit décide de ce qui mérite d'agir.
 */
export function signauxDe(client: LigneClient, maintenant = Date.now()): Signal[] {
  const signaux: Signal[] = []
  const etape = client.lifecycle_stage

  // Un compte admin n'est pas un client à travailler.
  if (etape === 'admin') return signaux

  // 1. Essai qui se termine. Le seul moment où un mot peut convertir : après,
  //    l'accès est déjà coupé et le message change de nature.
  const finEssai = tempsDe(client.trial_ends_at)
  if (etape === 'essai_en_cours' && finEssai !== null && finEssai > maintenant) {
    const joursRestants = Math.ceil((finEssai - maintenant) / JOUR)
    const declenchement = finEssai - 3 * JOUR
    if (joursRestants <= 3 && !contacteDepuis(client, declenchement)) {
      signaux.push({
        key: 'essai_finit',
        urgence: 1,
        label: 'Essai bientôt fini',
        raison:
          joursRestants <= 1
            ? "L'essai se termine demain, ou aujourd'hui. Après, ce n'est plus une relance."
            : `L'essai se termine dans ${joursRestants} jours.`,
        action: 'ecrire',
      })
    }
  }

  // 2. Impayé. Stripe relance seul puis résilie : la fenêtre pour écrire se
  //    compte en jours, et un rattrapage y est encore possible.
  if (etape === 'impaye') {
    const echec = tempsDe(client.last_payment_failed_at)
    if (!contacteDepuis(client, echec)) {
      signaux.push({
        key: 'impaye',
        urgence: 1,
        label: 'Paiement en échec',
        raison: echec
          ? `Prélèvement refusé il y a ${Math.floor((maintenant - echec) / JOUR)} jour(s). Stripe relance seul, puis résilie.`
          : 'Abonnement en impayé. Stripe relance seul, puis résilie.',
        action: 'ecrire',
      })
    }
  }

  // 3. Départ récent, jamais interrogé. Passé une semaine, le « pourquoi »
  //    ne reçoit plus de réponse : la fenêtre est courte et ne revient pas.
  const depart = tempsDe(client.canceled_at) ?? tempsDe(client.trial_canceled_at)
  if (
    (etape === 'resilie' || etape === 'essai_termine') &&
    depart !== null &&
    maintenant - depart <= 7 * JOUR &&
    !(client.surveys_sent ?? 0) &&
    !contacteDepuis(client, depart)
  ) {
    const jours = Math.floor((maintenant - depart) / JOUR)
    signaux.push({
      key: 'resilie_a_interroger',
      urgence: 2,
      label: 'Départ à comprendre',
      raison: `Parti il y a ${jours} jour(s), sans qu'on lui ait demandé pourquoi. Au-delà d'une semaine, plus personne ne répond.`,
      action: 'enquete',
    })
  }

  // 4. Abonné qui ne vient plus. Le meilleur indicateur avancé d'une
  //    résiliation : il se voit des semaines avant qu'elle n'arrive.
  if (etape === 'abonne') {
    const derniereVisite = tempsDe(client.last_login_date) ?? tempsDe(client.created_at)
    if (derniereVisite !== null) {
      const jours = Math.floor((maintenant - derniereVisite) / JOUR)
      const declenchement = derniereVisite + 45 * JOUR
      if (jours >= 45 && !contacteDepuis(client, declenchement)) {
        signaux.push({
          key: 'abonne_dormant',
          urgence: 2,
          label: 'Abonné dormant',
          raison: `Abonné payant, aucune connexion depuis ${jours} jours. C'est ce qui précède une résiliation.`,
          action: 'ecrire',
        })
      }
    }
  }

  // 5. Essai consommé, jamais relancé. Le gisement le plus évident, et celui
  //    qu'on oublie parce que rien ne le remonte.
  if (etape === 'essai_termine' && !(client.emails_sent ?? 0)) {
    signaux.push({
      key: 'essai_sans_relance',
      urgence: 3,
      label: 'Essai sans relance',
      raison: "A consommé son essai sans s'abonner, et n'a jamais reçu le moindre message depuis.",
      action: 'ecrire',
    })
  }

  // 6. Inscrit qui n'a jamais rien pris, ni essai, ni abonnement, et à qui on
  //    n'a jamais écrit. C'est la question d'origine du module : « pourquoi
  //    ne se sont-ils pas abonnés ? », qu'on ne peut poser qu'en la posant.
  //
  //    Le délai de quatorze jours écarte les inscriptions de la semaine, qui
  //    n'ont pas encore eu le temps de se décider : relancer quelqu'un
  //    d'inscrit avant-hier, c'est le presser, pas le comprendre.
  //
  //    Ce signal éclaire d'un coup tout l'arriéré, ce qui est voulu : c'est le
  //    travail qui existait déjà sans être visible. Il ne se rallume ensuite
  //    que pour les nouvelles inscriptions restées froides.
  const inscription = tempsDe(client.created_at)
  if (
    etape === 'inscrit' &&
    inscription !== null &&
    maintenant - inscription >= 14 * JOUR &&
    !(client.emails_sent ?? 0) &&
    !contacteDepuis(client, inscription)
  ) {
    signaux.push({
      key: 'inscrit_sans_relance',
      urgence: 3,
      label: 'Inscrit sans suite',
      raison: `Compte créé il y a ${Math.floor((maintenant - inscription) / JOUR)} jours, sans essai ni abonnement, et jamais contacté.`,
      action: 'enquete',
    })
  }

  // 7. Réponse restée sans suite. Quelqu'un a pris le temps d'écrire et
  //    personne ne lui a répondu : le silence coûte plus que la critique.
  const reponse = tempsDe(client.last_answer_at)
  if (reponse !== null && !contacteDepuis(client, reponse)) {
    const note = client.last_rating
    signaux.push({
      key: 'reponse_sans_suite',
      urgence: typeof note === 'number' && note <= 2 ? 2 : 3,
      label: 'Réponse sans suite',
      raison:
        typeof note === 'number' && note <= 2
          ? `A répondu à une enquête avec une note de ${note}/5, sans réponse de notre part.`
          : "A répondu à une enquête, sans réponse de notre part.",
      action: 'ecrire',
    })
  }

  // 8. Adresse morte. Insister ne sert à rien tant qu'elle n'est pas corrigée.
  if ((client.emails_failed ?? 0) > 0 && !(client.emails_sent ?? 0)) {
    signaux.push({
      key: 'adresse_en_echec',
      urgence: 4,
      label: 'Adresse en échec',
      raison: "Tous les envois vers cette adresse ont été refusés. Rien ne lui parvient.",
      action: 'corriger',
    })
  }

  return signaux.sort((a, b) => a.urgence - b.urgence)
}

/** Le signal le plus urgent, celui qui donne la couleur du voyant. */
export function signalPrincipal(client: LigneClient, maintenant = Date.now()): Signal | null {
  return signauxDe(client, maintenant)[0] ?? null
}
