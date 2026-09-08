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

Les lignes saisies à la main portent `metadata.manuel = true`, et
`customer_emails.provider = 'manuel'` pour un email consigné.

La vue `admin_customer_overview` agrège le tout, une ligne par compte, et
calcule `lifecycle_stage`. Elle n'est lisible que par la clé service-role.

Étapes du cycle de vie : `inscrit`, `essai_en_cours`, `essai_termine`,
`abonne`, `impaye`, `resilie`, `admin`. `essai_termine` désigne un compte qui
a consommé son essai sans jamais s'abonner ensuite : c'est la cible naturelle
d'une relance.

`resilie` est réservé aux résiliations payantes. Un essai abandonné produit un
événement `trial_canceled`, distinct de `canceled` jusque dans la vue : sans
cette séparation, l'admin proposerait « pourquoi avez-vous résilié votre
abonnement ? » à quelqu'un qui n'en a jamais eu, et l'enquête sur l'essai
deviendrait inatteignable.

Trois compteurs d'emails, à ne pas confondre :

| Colonne | Compte |
| --- | --- |
| `emails_sent` | Tout ce qui est réellement parti, consigné à la main compris |
| `emails_tracked` | Les seuls envois mesurables : ni consignés, ni refusés |
| `emails_failed` | Les envois refusés par Resend |

Un envoi refusé n'est pas une relance : le compter comme telle sortirait la
personne de « jamais relancé », donc on cesserait de la relancer, et la ferait
entrer dans « sans réaction », comme si elle avait ignoré un message qu'elle
n'a jamais reçu.

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

### Le lien de réponse pointe toujours vers la production

`surveyUrl()` construit le lien depuis `NEXT_PUBLIC_APP_URL`, jamais depuis
l'adresse du déploiement qui envoie. C'est voulu : un email parti chez un vrai
client ne doit pas renvoyer vers une préversion Vercel qui disparaîtra.

Conséquence à connaître en test : une enquête envoyée depuis une préversion
produit un lien vers la production, qui répond 404 tant que la version n'y est
pas déployée. Le jeton reste valide, l'email déjà reçu fonctionnera après le
déploiement, il n'y a rien à renvoyer.

## L'onglet « À traiter »

Le module ouvre sur ce qu'il y a à faire, pas sur un annuaire. Une liste de
comptes triée par date d'inscription ne dit pas par où commencer ; la file
d'attente ne montre que les comptes portant un signal actif, du plus urgent au
moins urgent, avec la raison écrite en clair à côté du nom.

Deux règles gouvernent les signaux, et elles comptent plus que la liste
elle-même :

1. **Une fenêtre qui se referme.** « L'essai finit dans trois jours » ne vaut
   que ces trois jours. Au-delà, ce n'est plus une relance mais un email de
   deuil. C'est la fenêtre qui crée l'urgence, pas la couleur du voyant.
2. **Une extinction automatique.** Le signal s'éteint dès qu'un contact lui est
   postérieur, email envoyé depuis le module ou action consignée à la main. Rien
   à cocher : entretenir une liste de tâches en plus du travail, personne ne le
   fait deux semaines de suite.

Sans ces deux règles, la moitié des comptes brilleraient en permanence, on
cesserait de les regarder, et les voyants deviendraient du papier peint. Un
voyant toujours allumé n'est pas un voyant.

| Signal | Condition | Urgence |
| --- | --- | --- |
| Essai bientôt fini | Essai en cours, fin dans 3 jours ou moins | 🔴 |
| Paiement en échec | Statut `past_due` | 🔴 |
| Départ à comprendre | Résiliation ou essai annulé depuis 7 jours au plus, aucune enquête envoyée | 🟠 |
| Payé, jamais ouvert | Abonné depuis plus de 7 jours qui n'a jamais lancé un produit qu'il paie | 🔴 |
| Abonné dormant | Abonné payant, aucune activité depuis 45 jours, ni site ni logiciel | 🟠 |
| Moitié de son offre inutilisée | Offre Premium, un produit actif depuis moins de 30 jours, l'autre délaissé depuis plus de 60 | 🟡 |
| Réponse sans suite | A répondu à une enquête, personne ne lui a répondu (🟠 si la note vaut 2 ou moins) | 🟡 |
| Essai sans relance | Essai consommé, aucun message envoyé depuis | 🟡 |
| Inscrit sans suite | Compte de plus de 14 jours, ni essai ni abonnement, jamais contacté | 🟡 |
| Adresse en échec | Tous les envois refusés | ⚫ |

### Deux produits, deux mesures

`last_login_date` ne compte que les visites du site OsteoUpgrade. Un abonné
MyOsteoFlow travaille dans le logiciel et n'ouvre jamais le site : mesuré sur
cette seule colonne, il ressort « aucune connexion depuis 45 jours », et le
module désigne comme dormant le client le plus assidu.

Le logiciel laisse pourtant une trace. `/api/osteoflow/verify` rafraîchit
`osteoflow_sessions.last_active_at` à chaque vérification de licence : c'est
un battement de cœur, la vue le lit sous `osteoflow_last_active_at`, avec le
nombre de postes.

Les deux usages restent **séparés** dans la vue comme dans l'interface, et
c'est délibéré : les fusionner perdrait ce qu'ils ont d'intéressant. Un abonné
Premium qui se sert du logiciel tous les jours sans jamais ouvrir l'e-learning
paie la moitié de son offre pour rien, et la question se posera d'elle-même au
renouvellement. `last_activity_at` n'agrège les deux que pour détecter un
silence complet.

Les signaux d'usage lisent donc l'offre souscrite : un abonné MyOsteoFlow seul
n'a aucune raison de visiter le site, un abonné OsteoUpgrade seul n'aura jamais
de session desktop. Réclamer les deux à l'un comme à l'autre produirait deux
contresens symétriques.

Le calcul vit dans `signauxDe()` (`lib/customer-tracking.ts`), fonction pure
sans dépendance : la page l'appelle sur les lignes déjà chargées, la route
l'appelle pour compter. Un seul endroit décide de ce qui mérite d'agir, sinon
l'onglet et l'indicateur finiraient par diverger.

L'extinction s'appuie sur `last_contact_at`, qui agrège les emails réellement
partis et les contacts consignés sur un autre canal. Ne regarder que les emails
éteindrait un signal sur un appel jamais passé, et le maintiendrait allumé
après un appel passé.

`inscrit_sans_relance` éclaire d'un coup tout l'arriéré au premier usage, ce
qui est voulu : c'est le travail qui existait déjà sans être visible. Il ne se
rallume ensuite que pour les nouvelles inscriptions restées froides.

## Consigner ce qui s'est passé ailleurs

Le rattrapage de la migration a reconstitué les dates que `profiles` portait
encore. Il ne pouvait rien savoir du reste : une relance partie de votre boîte,
un appel, une réponse reçue sur un autre canal. Sans moyen de l'inscrire, la
fiche d'une personne relancée trois fois affirme « jamais relancé », et le
filtre du même nom la remonte en tête des comptes à contacter. Une fiche fausse
est pire qu'une fiche vide : elle fait agir à tort.

Bouton **Consigner**, sur une fiche ou sur une sélection multiple. Rien n'est
envoyé, seule la chronologie est mise à jour, à la date que vous indiquez (jamais
dans le futur).

| Action | Effet |
| --- | --- |
| Email envoyé | Compte comme une relance dans les compteurs et les filtres |
| Appel téléphonique, Message, Réponse reçue, Autre contact | Apparaît dans la chronologie |
| Motif de départ | Renseigne le motif d'une résiliation antérieure au module |

Les entrées consignées portent la mention « Consigné à la main » et sont les
seules supprimables : un événement posé par Stripe est un fait, pas une saisie,
et l'effacer ferait mentir la chronologie sur ce qui s'est réellement produit.

Le motif de départ ne crée pas un second événement de résiliation, il complète
celui qui existe : deux « Résiliation » dans une chronologie laisseraient croire
à deux départs. Il est affiché avec la réserve qui s'impose, un motif ressaisi
de mémoire n'étant pas la parole du client.

### Emails consignés et mesure

Un email consigné n'aura jamais de statut d'ouverture : rien ne peut être
mesuré d'un message parti d'ailleurs. La vue distingue donc `emails_sent` (tout
ce qui est parti, consigné compris) de `emails_tracked` (les seuls envois passés
par Resend). Le filtre « sans réaction » s'appuie sur le second, sans quoi il
affirmerait « relancé, aucun signe de vie » là où la vérité est « nous n'en
savons rien ».

## Notifications

Une réponse à une enquête déclenche une notification sur la cloche admin
(`admin_notifications`, temps réel), avec la réponse elle-même dans le corps :
le motif coché, la note, le début du texte libre. Lire un motif dans la
notification et devoir ouvrir l'application pour savoir s'il valait la peine
d'être lu ne sont pas la même chose, et un client qui vient d'expliquer son
départ est précisément celui qu'on peut encore rappeler.

**Une réponse par email, en revanche, ne déclenche rien.** Si un client répond
à une relance, le message arrive dans `received_emails` via
`/api/emails/inbound` et se compte dans la pastille « Boite mail » du tableau
de bord admin, sans notification sur la cloche. C'est un choix par défaut, pas
un oubli du module : l'adresse de réception encaisse aussi des retours
automatiques et des désabonnements, et une notification par message reçu
rendrait la cloche inutilisable. À rebrancher si le volume réel dit le
contraire.

## Suivi des ouvertures

Les emails partent par l'API transactionnelle Resend, avec le pied de
désinscription ajouté par `lib/mailing.ts`. Leur statut est mis à jour par le
webhook `POST /api/emails/events`.

**Trois réglages à faire une fois**, dans cet ordre. Les deux premiers sont
indissociables : le webhook seul ne recevrait jamais d'ouverture, et le suivi
resterait vide sans qu'aucune erreur ne le signale.

**1. Créer un sous-domaine de suivi** (Resend > Domains > `osteo-upgrade.fr`
> *New tracking subdomain*). Resend ne propose pas un simple interrupteur : le
suivi passe par un sous-domaine dédié, par exemple `links.osteo-upgrade.fr`,
qui héberge la redirection des liens. Il demande un enregistrement DNS (CNAME)
à ajouter chez le registrar, au même endroit que `resend._domainkey`.

Deux cases à l'intérieur :

- *Enable click tracking* : les liens des emails passent par ce sous-domaine.
  Signal fiable, à activer.
- *Enable open tracking* : image invisible dans chaque email. Resend prévient
  lui-même de son imprécision (voir plus bas).

Sans ce sous-domaine, les événements `email.opened` et `email.clicked`
n'existent tout simplement pas. `email.delivered`, `email.bounced` et
`email.complained`, eux, fonctionnent sans rien activer : le suivi reste utile
même si l'on refuse le suivi d'ouverture.

**2. Créer le point de terminaison** (Resend > Webhooks > Add Webhook) :

- URL : `https://www.osteo-upgrade.fr/api/emails/events`
- Événements : `email.delivered`, `email.opened`, `email.clicked`,
  `email.bounced`, `email.complained`

Ne pas ajouter ces événements au webhook de réception existant : cette URL
attend un email entrant et traiterait une ouverture comme un message reçu.

**3. Reporter le secret de signature** dans les variables d'environnement
Vercel, sous `RESEND_EVENTS_WEBHOOK_SECRET`, puis redéployer.

Resend attribue **un secret par point de terminaison**. Celui de la réception
(`RESEND_WEBHOOK_SECRET`) ne signe pas les événements d'envoi : le réutiliser
ferait rejeter toutes les livraisons en 401. La route accepte les deux
variables, ce qui la laisse fonctionner si les deux jeux d'événements
finissaient un jour sur la même URL, mais la variable dédiée est la bonne.

Sans ce webhook, tout fonctionne, mais un email reste au statut « envoyé » :
on sait qu'il est parti, jamais s'il a été lu. C'est pourtant la différence
entre « il ignore la relance » et « il n'a rien reçu ».

### Ce que vaut une ouverture

Le pixel de suivi est neutralisé par Apple Mail Privacy Protection, qui charge
les images à la place du destinataire, et par les clients qui bloquent les
images distantes. Une ouverture peut donc être fictive, et une absence
d'ouverture peut être une lecture réelle. Le clic, lui, est fiable.

Concrètement : le filtre « sans réaction » sert à repérer une adresse morte ou
une relance qui tombe à plat, pas à conclure que la personne n'a pas lu. Il
retient les comptes sans ouverture **ni clic**, ce qui le laisse utilisable si
le suivi d'ouverture reste désactivé : `emails_opened` vaudrait alors zéro
partout, et un filtre qui ne regarderait que ce compteur désignerait comme
silencieux quelqu'un venant de cliquer sur la relance.

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
