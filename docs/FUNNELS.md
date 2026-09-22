# Funnels : pages de vente éditables

Pages de vente autonomes servies sur `/f/<slug>`, créées et modifiées depuis
**Administration → Funnels**, sans redéploiement.

## Pourquoi dans l'application plutôt qu'un outil externe

L'infrastructure qu'un LearnyBox ou un ClickFunnels apporte existe déjà ici :
paiement Stripe, moteur de séquences email (`mail_automations`), codes promo,
parrainage, base de contacts. Un outil externe aurait imposé de synchroniser
deux bases de contacts et deux catalogues d'offres. Il ne manquait que la
couche « pages » : c'est ce que fait ce module.

## Structure

| Élément | Emplacement |
|---|---|
| Page publique | `app/f/[slug]/page.tsx` |
| Rendu des blocs | `components/funnel/FunnelRenderer.tsx` |
| Éditeur admin | `app/admin/funnels/` |
| Modèle & validation | `lib/funnels.ts` |
| Attribution UTM | `lib/utm.ts` |
| API publique | `app/api/funnels/{lead,track}` |
| API admin | `app/api/admin/funnels/` |
| Schéma | `supabase/migrations/20260902_funnels.sql` |

## Blocs disponibles

`hero`, `video`, `benefits`, `testimonials`, `curriculum`, `image`, `pricing`,
`guarantee`, `faq`, `cta`, `optin`, `teaser`, `text`.

Le bloc **`teaser`** (« Aperçu verrouillé ») montre qu'il y a du contenu
derrière le formulaire sans dire lequel : une grille de cartes cadenassées et
numérotées, plus des repères de format (« 7 vidéos », « environ 1 h »). Il
répond au défaut d'une liste de bénéfices sur une page dont l'aimant EST le
contenu : nommer ce qu'on va apprendre, c'est le dévoiler, donc vendre en
spoilant. Ce bloc donne la forme et retient le fond.

L'accroche peut porter un **filigrane de marque** : la sphère du logo, en
débord à droite. C'est `public/logo-mark.png`, extrait du lockup
`logo-email-banner.png`. Le lockup complet ne convient pas en filigrane : il
porte le nom et la signature, dont la transparence produit des mots fantômes
derrière l'accroche.

L'accroche et le rappel final acceptent un fond **clair** (défaut) ou
**sombre**, au choix dans l'éditeur. Le clair est le défaut parce qu'un aplat
ardoise en haut de page écrase les couleurs de marque et referme la page dès le
premier écran ; le sombre reste utile pour ponctuer une fin de page.

Le bloc `image` (« Photo ») envoie le fichier sur **Vercel Blob** via
`/api/funnels/image-upload` : même schéma que les envois existants du projet :
réservé aux admins, type et taille vérifiés, SVG exclu (une image servie sur une
URL publique peut y embarquer du script). Une URL `https` peut aussi être
collée. L'accroche accepte la même image en illustration.

Les images sont rendues par `next/image` ; le domaine
`**.public.blob.vercel-storage.com` est déjà déclaré dans `next.config.js`.

Le contenu est un tableau JSONB : ajouter un type de bloc ne demande pas de
migration, seulement une entrée dans `funnelBlockSchema` (validation), dans
`BlockEditor` (saisie) et dans `FunnelRenderer` (affichage).

Les textes sont rendus **comme du texte** : le HTML n'est jamais interprété.
Les sauts de ligne sont conservés. Les vidéos ne sont chargées que depuis Vimeo
et YouTube (`safeEmbedUrl`).

## Échéance de l'offre

Trois modes :

- **`none`** : pas de compte à rebours.
- **`fixed`** : même date pour tout le monde. C'est le modèle CFPCO : une
  session qui ferme.
- **`relative`** : J+N après l'opt-in, propre à chaque lead. C'est le modèle
  adapté à un abonnement permanent : la page reste en ligne, mais l'offre du
  visiteur expire. Le décompte n'apparaît qu'après l'inscription : avant, il
  n'y a rien à décompter.

Un renvoi du formulaire ne repousse pas l'échéance : sinon il suffirait de se
réinscrire pour rouvrir une offre fermée.

## Séquence email

Chaque opt-in déclenche les automatisations dont le `trigger_event` vaut
`funnel:<slug>`. L'éditeur affiche ce déclencheur, indique si une séquence
l'écoute, et permet de la créer d'un bouton.

### Où atterrissent les contacts

Un opt-in crée un contact dans `mail_contacts`, étiqueté `funnel:<slug>` dans
la colonne `tags`, plus une ligne dans `funnel_leads`.

**Ce n'est pas la lettre d'information.** Un envoi « tous les inscrits » lit
`profiles` avec `newsletter_opt_in = true` (`app/api/mailing/send/route.ts`) :
un lead de funnel, qui n'a pas de compte, n'y figure pas et ne le recevra donc
pas. `mail_contacts` alimente les séquences automatiques, pas les diffusions
générales.

Le contact est créé dans `mail_contacts` par `ensureMailContact()`, **avant**
toute recherche de séquence. C'est délibéré : `triggerAutomations` sort dès
qu'aucune séquence active ne correspond à l'événement, et lui déléguer la
création du contact ferait perdre toutes les adresses captées tant que la
séquence n'est pas écrite : c'est-à-dire dans l'état normal juste après la
publication d'une page. Une inscription entre donc dans la liste de diffusion
même sans séquence.

Il n'y a qu'une seule liste de diffusion : les règles existantes
(désabonnement, promotion d'un statut « lead », `stop_on_subscribe`)
s'appliquent sans traitement particulier.

La séquence est créée avec `stop_on_subscribe = true` : un prospect qui
souscrit cesse aussitôt de recevoir les relances. Sans ça, un nouvel abonné
continuerait de lire « il vous reste 3 jours pour profiter de l'offre » : pour
une offre qu'il vient de payer.

### Écrire les emails d'une séquence

L'application ne sait pas éditer les *étapes* d'une séquence : le bouton crée
la séquence et son déclencheur, les emails s'ajoutent en base, comme pour
toutes les séquences du cycle de vie existantes.

Une étape (`mail_automation_steps`) porte :

| Colonne | Rôle |
|---|---|
| `step_order` | ordre d'envoi |
| `wait_minutes` | délai **depuis l'étape précédente** (depuis l'inscription pour la première) |
| `subject` | objet, variables comprises |
| `template_slug` | `mail_templates.name` (ou son UUID). Vide → le corps vient de `payload.html` |
| `payload` | contenu direct et/ou variables supplémentaires |

Variables disponibles, par priorité croissante : le contact
(`{{first_name}}`, `{{last_name}}`, `{{email}}`, `{{full_name}}`), puis le
`payload` de l'étape, puis les metadata de l'inscription.

Pour les funnels, ces metadata sont renseignées à l'opt-in : `{{funnel_slug}}`
et les UTM (`{{utm_campaign}}`, `{{utm_source}}`…) sont donc utilisables
directement dans le sujet comme dans le corps.

## Attribution des campagnes

Le chemin d'une vente traverse trois pages et deux domaines : funnel →
inscription → Stripe. Les paramètres UTM ne survivent pas à ce parcours seuls.

1. À l'arrivée sur `/f/<slug>`, les UTM présents dans l'URL sont copiés dans le
   cookie premier-partie `ou_attrib` (90 jours).
2. Le **premier** contact est conservé : un retour en direct n'écrase pas la
   campagne d'origine, sinon toutes les conversions finiraient attribuées au
   canal qui n'a rien coûté.
3. `/api/stripe/checkout` relit le cookie et écrit les UTM dans les metadata de
   la session **et** de l'abonnement Stripe.

Résultat : dans Stripe, chaque abonnement porte la campagne qui l'a produit.

Les leads portent aussi leur propre `utm` en base (`funnel_leads.utm`), visible
dans l'éditeur.

## Parcours d'achat

Stripe exige un compte (l'API refuse un appel anonyme). Un CTA « souscription »
envoie donc vers `/auth?funnel=<slug>&plan=<planType>`, et `/auth` enchaîne sur
le paiement dès le compte créé : le visiteur n'a pas à retrouver l'offre qu'il
venait d'accepter.

`/api/stripe/checkout` refait deux vérifications côté serveur avant de créer la
session :

- **l'offre demandée est bien celle de la page** : sinon le slug d'un funnel
  encore ouvert servirait à valider n'importe quelle autre offre ;
- **l'échéance n'est pas dépassée** (date fixe du funnel, ou échéance
  individuelle du lead) : le compte à rebours affiché n'engage que le
  navigateur, et un lien conservé ou une horloge décalée suffisent à
  l'atteindre après la fin annoncée. Une offre présentée comme fermée doit
  l'être réellement.

Si le funnel n'a pas d'offre configurée mais contient un bloc `optin`, les CTA
« souscription » basculent automatiquement vers le formulaire email.

## Contenu réservé aux inscrits

Chaque bloc porte un drapeau `gated`. Un bloc réservé n'est **pas envoyé au
navigateur** tant que le visiteur n'a pas laissé son email : le tri se fait
côté serveur dans `app/f/[slug]/page.tsx`. Le masquer en CSS aurait laissé les
URL des vidéos lisibles dans la source de la page, ce qui vide l'inscription
de son intérêt.

Le déverrouillage repose sur le cookie `ou_optin_<slug>`, posé par
`/api/funnels/lead` et propre à chaque funnel. Après l'inscription, la page
appelle `router.refresh()` : le serveur refait le rendu et joint cette fois les
blocs réservés.

### Aperçu et vue visiteur

En aperçu (`?preview=1`, admin connecté), la page entière est affichée,
contenu réservé compris : un aperçu qui masque les vidéos et les tarifs ne
permettrait pas de relire l'essentiel de la page.

`?preview=1&visiteur=1` rétablit le portillon pour vérifier ce que voit un
nouveau visiteur. Le bandeau d'aperçu indique l'état courant et propose le
lien pour basculer.

Le portillon reste entier hors aperçu : un visiteur ne devient jamais admin.

### Portée de l'accès

L'accès est **lié au navigateur, pas à l'adresse email** : le cookie vaut 180
jours sur cet appareil. Sur un autre appareil, le visiteur redonne son email,
ce qui met simplement à jour son lead sans le dupliquer.

Rien n'empêche de partager la page, ni de relever l'URL de la vidéo dans la
source une fois débloquée. C'est le comportement attendu d'un aimant à
prospects : l'objectif est la diffusion, pas la rétention. Un accès réellement
nominatif demanderait un lien signé envoyé par email, ou un compte.

> **Portée du portillon.** Le cookie n'est pas signé : le forger donne accès à
> un contenu offert en échange d'un email, pas à du contenu payant. C'est le
> bon niveau pour un aimant à prospects. Du contenu réellement payant demande
> un compte et un contrôle de droits, pas un cookie.

## Vidéos

Le champ accepte le lien du bouton **Partager** de Vimeo
(`vimeo.com/123?share=copy`), converti en lien d'intégration à
l'enregistrement par `toEmbedUrl`, qui réutilise `extractVimeoId` du module
e-learning. Les formats YouTube `youtu.be/…` et `watch?v=…` sont également
convertis. L'affichage reste filtré par `safeEmbedUrl`.

## Deux offres sur une même page

Un bloc tarifs peut porter son propre `planType`, qui prend le pas sur l'offre
du funnel, et un drapeau `highlighted` pour la mise en avant. C'est ce qui
permet d'afficher OsteoUpgrade et Premium côte à côte.

## Ce que l'opt-in fait et ne fait pas

Le formulaire crée un **contact de diffusion** (`mail_contacts`) et un **lead**
(`funnel_leads`). Il ne crée **pas** de compte : ni `auth.users`, ni `profiles`.

Conséquence à ne pas manquer en rédigeant une page : un contenu réservé aux
comptes (même gratuits) n'est pas accessible juste après l'opt-in. La promesse
de la page doit donc être « vous recevez le lien pour créer votre accès », pas
« accès immédiat ». Le premier email de la séquence porte ce lien, vers
`/auth?funnel=<slug>`.

Corollaire sur les séquences : `stop_on_subscribe` ne coupe que sur une
souscription **payante**. Créer un compte gratuit n'annule rien, et les
séquences d'inscription existantes (« Bienvenue », « Relance Premium ») se
déclenchent alors en plus. Gardez donc une séquence de funnel courte, dont le
seul rôle est d'amener à la création du compte, et laissez l'onboarding
existant faire la suite.

## Statuts et aperçu

Seul un funnel `published` est servi aux visiteurs. Un `draft` ou un `archived`
renvoie une **404** : c'est ce qui empêche une page en préparation d'être lue
par quelqu'un qui devine son slug.

Pour relire une page avant de la diffuser, l'éditeur et la liste pointent vers
`/f/<slug>?preview=1`. L'aperçu n'est accordé qu'à un **admin connecté** (session
vérifiée côté serveur) et affiche un bandeau rappelant que la page n'est pas
publique. Sans ce contrôle, `?preview=1` suffirait à lire n'importe quel
brouillon : une offre en préparation, ses prix et sa date de lancement.

## Statistiques

Vues, clics CTA, opt-ins et départs au paiement sont écrits dans
`funnel_events` par `/api/funnels/track` et `/api/funnels/lead`.

Deux points à connaître :

- **Un brouillon n'enregistre rien.** Les deux routes refusent un funnel qui
  n'est pas `published`. Les visites d'aperçu ne comptent donc pas, et les
  compteurs restent à zéro jusqu'à la publication. C'est voulu : une page en
  préparation ne doit pas polluer les chiffres de la campagne.
- **L'agrégation se fait en SQL**, par la fonction `funnel_stats(uuid[])`.
  Compter les lignes ramenées côté application les aurait plafonnées à la
  limite de lignes de PostgREST, sans erreur pour le signaler : les compteurs
  se seraient figés en silence une fois la campagne lancée. La fonction n'est
  exécutable que par `service_role`, la fréquentation d'une campagne n'ayant
  pas à être lisible depuis le navigateur.

## Sécurité

- Les trois tables n'ont **aucune** politique `anon` : rien n'est lisible depuis
  le navigateur. La page publique est rendue côté serveur avec la clé
  service-role, qui filtre sur `status = 'published'`. Un brouillon n'est jamais
  servi, même en devinant son slug.
- `/api/funnels/lead` et `/api/funnels/track` sont publics mais limités en débit
  et refusent un funnel non publié.
- Les liens de CTA « lien libre » sont restreints à `http(s)` à l'enregistrement
  **et** au clic (`safeLinkUrl`) : sans ça, une URL `javascript:` stockée en
  base s'exécuterait dans l'origine de l'application au premier clic d'un
  visiteur. La double vérification couvre les enregistrements antérieurs à
  cette règle.
- Les pages funnel sont exclues du middleware d'authentification et marquées
  `noindex` : elles sont diffusées par email et publicité, et leur
  référencement concurrencerait la page d'accueil sur les mêmes requêtes.

## Mise en service

Le schéma est **déjà appliqué** sur le projet Supabase `osteoupgrade`
(migration `funnels`, 2026-09-02). Aucune variable d'environnement
supplémentaire n'est nécessaire : le module réutilise Supabase, Stripe et
Resend déjà configurés.

Pour un autre environnement :

```bash
supabase db push
# ou : coller supabase/migrations/20260902_funnels.sql dans le SQL Editor
```

### Vérifications passées à l'application

- Un visiteur `anon` ne lit aucune ligne de `funnels`, même publiée : le rendu
  public passe bien par la clé service-role.
- Les contraintes refusent un slug non conforme, une échéance annoncée sans
  date ni durée, un statut ou un type d'événement inconnu.
- Deux opt-ins avec la même adresse à la casse près ne créent qu'un seul lead
  (colonne `citext`).

## Limites connues

- **Pas de test A/B.** Comparer deux versions d'une page demande un tirage
  stable par visiteur et un calcul de significativité : c'est un module à part
  entière, pas une option de celui-ci.
- **Pas de pixels publicitaires** (Meta, Google). Seul Vercel Analytics est en
  place ; le retargeting demanderait d'abord une bannière de consentement
  couvrant ces traceurs.
- **Pas de paiement à l'unité ni de 3×.** `/api/stripe/checkout` est en
  `mode: 'subscription'`. Vendre une formation à prix unique demanderait un
  mode `payment`, donc un parcours et des droits distincts.
- Le compteur de vues n'exclut pas les robots.
