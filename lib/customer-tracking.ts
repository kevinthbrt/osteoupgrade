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
