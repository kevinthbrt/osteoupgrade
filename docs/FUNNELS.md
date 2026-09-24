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
numérotées, plus des repères de format (« 7 vidéos », « 21 minutes »). Il
répond au défaut d'une liste de bénéfices sur une page dont l'aimant EST le
contenu : nommer ce qu'on va apprendre, c'est le dévoiler, donc vendre en
spoilant. Ce bloc donne la forme et retient le fond.

Le champ **`thumbnails`** remplit ces cartes avec les vraies vignettes des
vidéos, floutées à 8 px. Une carte vide prouve mal qu'il y a du contenu ;
une vignette nette le dévoile. Pour des vidéos de formation, la vignette est
souvent une diapositive entière : le titre de la leçon y redevient déchiffrable
en dessous de 8 px, et la page publierait alors le programme qu'elle réserve.
Le flou n'est pas une protection, seulement une mise en scène : l'URL de
l'image reste lisible dans la source, contrairement aux vidéos elles-mêmes, qui
ne sont pas envoyées au navigateur avant l'inscription. N'y mettre que des
vignettes dont la version nette ne serait pas gênante. Les URL sont saisies une
par ligne dans l'éditeur, dans l'ordre des cartes ; sans URL, la carte reste une
silhouette neutre.

Une vignette Vimeo s'obtient par l'API oembed, y compris pour une vidéo privée :
`https://vimeo.com/api/oembed.json?url=<url>&width=640`, champ `thumbnail_url`.
Le paramètre `?region=` renvoyé par l'API se retire sans conséquence.
`i.vimeocdn.com` est déjà autorisé dans `next.config.js`.

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

## Remise personnelle

Chaque inscription à un funnel crée **son propre code promotionnel Stripe**,
à usage unique, valable sept jours à compter de cette inscription
(`lib/funnel-promo.ts`). Le coupon, qui porte la remise, est partagé et créé
à la première utilisation sous un identifiant fixe ; les codes, qui sont les
jetons d'accès à cette remise, sont individuels. C'est le découpage prévu par
Stripe.

Ce détour est ce qui rend l'échéance honnête. Un code de campagne unique porte
une date de fin absolue, la même pour tout le monde, alors que les inscriptions
arrivent en continu : écrire « il vous reste sept jours » dans une séquence
permanente reviendrait sinon à annoncer une échéance qu'on n'applique pas.

Points de vigilance :

- le coupon est restreint aux trois offres mensuelles publiques. Les tarifs
  Fondateur en sont exclus, comme ils le sont déjà de l'essai gratuit : ils sont
  à moitié prix à vie, une remise empilée reviendrait à offrir l'abonnement ;
- changer le pourcentage impose de changer l'identifiant du coupon. Les
  abonnements déjà remisés courent dessus, il ne doit pas bouger sous eux ;
- le code est relu au moment du paiement à partir de l'adresse du compte,
  jamais accepté depuis la requête : sinon n'importe qui réclamerait le code
  d'un autre. La recherche ne dépend pas du funnel d'arrivée, car quelqu'un qui
  revient deux jours plus tard et s'abonne depuis la page des tarifs a perdu le
  paramètre `funnel` en route ;
- elle dépend en revanche de l'adresse : s'inscrire au funnel avec une adresse
  et créer son compte avec une autre fait payer le plein tarif. C'est pour cela
  que l'écran de confirmation et les emails rappellent d'utiliser la même ;
- un code refusé par Stripe (déjà consommé, supprimé depuis le tableau de bord)
  ferait échouer la session de paiement entière, pas seulement la remise. La
  création est donc réessayée une fois sans remise : mieux vaut perdre la remise
  que la vente ;
- Stripe interdit `discounts` et `allow_promotion_codes` sur la même session.
  Quand une remise s'applique, le champ de saisie disparaît ;
- si Stripe est indisponible à l'inscription, le lead est enregistré sans code
  et la tentative suivante en crée un. Entre les deux, les emails afficheront un
  code vide : la liste des leads de l'administration affiche « aucun » pour
  rendre le cas visible.

L'essai gratuit de sept jours se cumule. Ce n'est pas un réglage du funnel mais
une règle de compte, ouverte une fois dans la vie d'un compte gratuit : il n'est
pas possible de le désactiver pour une seule page.

### Activer, afficher

La remise est **désactivée par défaut** et s'active funnel par funnel
(`promo_enabled`, case « Offrir une remise » dans l'éditeur). Sans elle, aucune
inscription ne crée de code et la page n'en parle pas.

Quand elle est active :

- un encart l'annonce au-dessus du formulaire, avant l'inscription ;
- l'inscription pose le cookie `ou_promo_<slug>`, qui porte l'échéance du code
  et expire avec lui ;
- tant que ce cookie vaut, les blocs tarifs d'une offre mensuelle publique
  affichent le prix barré, le prix remisé et un compte à rebours, et la page
  d'inscription remise ses trois abonnements. Un bloc tarifs Fondateur reste au
  plein prix : le coupon ne s'y applique pas.

Ce cookie ne sert qu'à l'affichage. Modifié à la main, il change ce qu'on voit,
pas ce qu'on paie : la remise est relue sur le lead au paiement, puis contrôlée
par Stripe.

Les constantes (`PROMO_PERCENT`, `PROMO_MONTHS`, `PROMO_VALID_DAYS`) vivent dans
`lib/funnels.ts`, lisible côté navigateur, et non dans `lib/funnel-promo.ts`,
qui charge le SDK Stripe.

### Échéance qui ferme, échéance qui affiche

`deadline_blocks_checkout` sépare les deux usages. Une offre limitée doit
vraiment se fermer, sinon le décompte n'est qu'un décor. Une remise limitée,
non : passé le délai, le prospect doit pouvoir s'abonner au plein tarif plutôt
que de se heurter à une porte fermée, et c'est Stripe qui refusera le code
expiré.
