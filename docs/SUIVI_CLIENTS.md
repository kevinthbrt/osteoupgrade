# Suivi des clients (`/admin/clients`)

Module d'administration qui répond à quatre questions que `profiles` seul ne
permettait pas de poser :

1. Ce compte a-t-il pris l'essai gratuit ?
2. L'a-t-il annulé, et pourquoi ?
3. Quelle offre a-t-il prise, et depuis quand ?
4. Que lui a-t-on déjà écrit, et l'a-t-il lu ?

Il complète `/admin/users`, qui reste l'écran de gestion des comptes (rôle,
offre, statut Fondateur). Ici on ne modifie pas un compte : on suit un
parcours et on écrit à la personne.

## Pourquoi une chronologie séparée

`profiles` ne porte que l'état courant. Un compte qui a pris un essai,
l'a abandonné, s'est abonné six mois plus tard puis a résilié se présente
exactement comme un compte créé hier et jamais utilisé : `plan = 'free'`,
`subscription_status` vide. Le motif de résiliation collecté par le portail
Stripe partait dans une notification à l'administrateur puis se perdait.

`customer_events` conserve cette histoire. Les événements sont posés par :

| Origine | Événements |
| --- | --- |
| Trigger SQL `log_signup_customer_event` | `signup` |
| `app/api/stripe/webhook` | `trial_started`, `subscribed`, `trial_converted`, `plan_changed`, `renewed`, `payment_failed`, `canceled`, `trial_canceled` |
| `app/api/admin/update-user-role` | `plan_changed` (offre accordée à la main) |
| `app/api/admin/toggle-founding-member` | `founding_granted` |
| `app/api/admin/customers/email` | `admin_email`, `survey_sent` |
| `app/api/avis/[token]` | `survey_answered` |

Les comptes existant avant la mise en service ont été rattrapés par la
migration, avec `source = 'backfill'` : la chronologie est reconstituée à
partir de `created_at`, `trial_used_at`, `subscription_start_date` et
`subscription_end_date`. Les motifs de résiliation antérieurs, eux, sont
définitivement perdus : ils n'ont jamais été stockés.

## Tables

| Table | Rôle |
| --- | --- |
| `customer_events` | Chronologie. `reason` et `comment` portent le motif de départ Stripe. |
| `customer_emails` | Emails envoyés depuis une fiche, avec statut d'ouverture et de clic. |
| `customer_notes` | Notes internes, jamais visibles du client. |
| `customer_surveys` | Enquêtes envoyées et réponses reçues. |
| `profiles.admin_tags` | Étiquettes libres de segmentation. |

La vue `admin_customer_overview` agrège le tout, une ligne par compte, et
calcule `lifecycle_stage`. Elle n'est lisible que par la clé service-role.

Étapes du cycle de vie : `inscrit`, `essai_en_cours`, `essai_termine`,
`abonne`, `impaye`, `resilie`, `admin`. `essai_termine` désigne un compte qui
a consommé son essai sans jamais s'abonner ensuite : c'est la cible naturelle
d'une relance.

## Écrire à un client

Deux modes, depuis une fiche ou depuis une sélection multiple :

- **Message** : texte libre, habillé du gabarit maison (cf. CLAUDE.md).
  Champs de fusion `{{prenom}}`, `{{nom}}`, `{{offre}}`. Bouton d'action
  facultatif.
- **Enquête** : une question unique et un lien de réponse personnel, qui
  ouvre `/avis/<token>` sans demander de connexion. Exiger un compte pour
  répondre à « pourquoi êtes-vous parti ? » écarterait exactement les
  personnes que l'on interroge.

Quatre enquêtes prédéfinies, chacune associée à une étape du cycle de vie :

| Enquête | Cible |
| --- | --- |
| `pourquoi_pas_abonne` | Inscrit qui n'a jamais rien pris |
| `pourquoi_essai_annule` | Essai consommé sans abonnement |
| `pourquoi_resiliation` | Compte résilié |
| `satisfaction` | Abonné ou essai en cours (note de 1 à 5) |

L'admin propose par défaut celle qui correspond à la fiche ouverte. Pour un
envoi groupé, la proposition n'apparaît que si toute la sélection est au même
stade.

Les réponses remontent dans l'onglet **Réponses**, avec le classement des
motifs les plus cités et la satisfaction moyenne.

## Suivi des ouvertures

Les emails partent par l'API transactionnelle Resend, avec le pied de
désinscription ajouté par `lib/mailing.ts`. Leur statut est mis à jour par le
webhook `POST /api/emails/events`.

**À configurer une fois** sur https://resend.com/webhooks :

- URL : `https://www.osteo-upgrade.fr/api/emails/events`
- Événements : `email.delivered`, `email.opened`, `email.clicked`,
  `email.bounced`, `email.complained`
- Secret de signature : la variable `RESEND_WEBHOOK_SECRET` déjà utilisée par
  le webhook de réception `/api/emails/inbound`

Sans ce webhook, tout fonctionne, mais un email reste au statut « envoyé » :
on sait qu'il est parti, jamais s'il a été lu. C'est pourtant la différence
entre « il ignore la relance » et « il n'a rien reçu ».

Le statut ne recule jamais : un email déjà ouvert ne redevient pas
« seulement délivré », les événements Resend pouvant arriver désordonnés.

## Listes de travail

Les filtres rapides du tableau existent pour agir, pas pour explorer :

- **Jamais relancé** : aucun email envoyé depuis le module.
- **N'ouvre jamais** : des emails envoyés, aucune ouverture. Insister coûte
  de la délivrabilité.
- **Inactif 30 jours** : aucune connexion depuis un mois, ou jamais.
- **Enquête sans réponse** : sollicité, silencieux.

Chaque indicateur en tête de page est cliquable et applique le filtre d'étape
correspondant. L'export CSV reprend exactement la liste affichée, filtres et
tri compris.
