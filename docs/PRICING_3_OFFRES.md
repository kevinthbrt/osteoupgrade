# Passage à 3 offres — plan d'implémentation

Statut : **phases 0 à 4c terminées** — 0 à 4a déployées le 19/08/2026 (PR #323),
4b partiellement déployée (PR #324, trois commits encore à merger), 4c du
20/08/2026. Phase 5 (release desktop 1.18.0) prête à builder.
Contrainte majeure : **le site et l'application desktop sont en production.**
Aucune phase ne doit modifier le comportement des utilisateurs existants.

---

## 1. Les offres

| Offre | Contenu | Prix | Price ID Stripe |
|---|---|---|---|
| **Bundle** (actuelle) | OsteoUpgrade + MyOsteoFlow | 49,99 €/mois | `price_1TqqwCEr5HqbRRSri15NXlif` (inchangé) |
| **MyOsteoFlow seul** | Application cabinet + IA | 29,99 €/mois | `price_1U66MeEr5HqbRRSrTFTPeiOr` |
| **OsteoUpgrade seul** | E-learning, pratique, flashcards, tests | 29,99 €/mois | `price_1U66MlEr5HqbRRSrrx7lHFan` |

Remise bundle : 59,98 → 49,99 €, soit **−17 %** (argument commercial à afficher).

### Offre Fondateur (−50 %, annuelle)

Les membres fondateurs choisissent l'offre de leur choix, toujours à −50 % :

| Offre fondateur | Prix | Price ID |
|---|---|---|
| Bundle | 299,94 €/an | `price_1TqqwBEr5HqbRRSrkCNHqUdA` (inchangé) |
| MyOsteoFlow seul | 179,94 €/an | `price_1U66MwEr5HqbRRSrl4BvuJVx` |
| OsteoUpgrade seul | 179,94 €/an | `price_1U66N3Er5HqbRRSrb0zwZMfY` |

→ **6 prix Stripe au total** (3 mensuels standard + 3 annuels fondateur).

### Essai gratuit

7 jours sur les 3 offres. Règles inchangées par ailleurs :
- **un seul essai par compte à vie** (`profiles.trial_used_at`), quelle que soit l'offre choisie ;
- carte requise dès la souscription (`payment_method_collection: 'always'`) ;
- anti-abus par empreinte de carte (`trial_card_fingerprints`) conservé ;
- jamais cumulable avec l'offre Fondateur.

**Tranché** : l'essai donne les **entitlements complets de l'offre choisie**.
Jusqu'ici le rôle `trial` ne déverrouillait que MyOsteoFlow, y compris pour un
essai du bundle — une protection anti-abus qui n'a plus de sens dès lors qu'on
peut essayer l'offre OsteoUpgrade (l'essai porterait alors sur rien). Ce
changement de comportement intervient en **phase 2**, quand `plan` pilotera les
droits ; les essais en cours à ce moment-là devront être remappés vers le plan
réellement souscrit.

### Parrainage

Mois offert **à montant variable** = prix de l'offre du filleul (29,99 ou 49,99 €).
`REFERRAL_FREE_MONTH_AMOUNT` (constante fixe dans `lib/stripe.ts`) devient une
fonction du plan souscrit.

**Tranché** : un abonné MyOsteoFlow-seul a droit à un code de parrainage. Le
trigger `trigger_create_referral_code_on_premium` ne se déclenche aujourd'hui
que pour `role IN ('premium','admin')` — donc pas pour `plan = 'osteoflow'`
(miroir `trial`). Sa condition `WHEN` est à étendre en phase 4.

**Tranché** : les codes promo (`/admin/promo`) et partenaires (`/admin/partners`)
s'appliquent aux **trois offres**.

### Changement d'offre

Via le **portail client Stripe** configuré avec les 3 prix (`customer_update` +
`subscription_update`). Stripe gère la proration ; le webhook
`customer.subscription.updated` resynchronise `profiles.plan` depuis le price ID.
Pas de tunnel de checkout dédié à maintenir.

---

## 2. Modèle d'entitlements

### Le principe

Nouvelle colonne source de vérité :

```sql
profiles.plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free','osteoflow','osteoupgrade','bundle'))
```

`profiles.role` est **conservé comme miroir dérivé** de `plan`, maintenu par
trigger. Ce n'est pas de la dette : c'est ce qui rend la migration sûre.

| `plan` | `role` miroir | `has_osteoflow` | `has_osteoupgrade` |
|---|---|---|---|
| `free` | `free` | non | non (sauf `is_free_access`) |
| `osteoflow` | `trial` | **oui** | non |
| `osteoupgrade` | `premium` | non | **oui** |
| `bundle` | `premium` | **oui** | **oui** |
| (admin) | `admin` | oui | oui |

L'état « en essai » n'est plus porté par le rôle mais par
`subscription_status = 'trialing'`, déjà présent et déjà écrit par le webhook.

### Pourquoi ça ne casse presque rien

Le rôle `trial` a aujourd'hui **exactement** la sémantique de l'offre
« MyOsteoFlow seul » (cf. `supabase/migrations/20260715_trial_role_myosteoflow_only.sql`).
Avec le miroir ci-dessus, tout le code qui teste `role IN ('premium','admin')`
reste correct sans modification :

- les **7 policies RLS** de `20260415_simplify_subscription_tiers.sql`
  (`elearning_formations`, `orthopedic_tests`, `pathologies`,
  `elearning_topographic_views`, `practice_videos`, `elearning_quizzes` +
  `_questions` + `_answers`) ;
- les **3 RPC `SECURITY DEFINER`** `get_all_formations_with_progress`,
  `get_formation_full`, `get_formation_progress_full` ;
- les endpoints contenu servis au desktop : `flashcards/{decks,cards,review}`,
  `practice-video`, `literature-review/[id]`, `formations` (via RPC),
  `course-full`, `course-progress`, `submit-quiz`, `ortho-tests`.

### La seule faille réelle à corriger

`plan = 'osteoupgrade'` se miroite en `role = 'premium'`, ce qui laisserait
l'utilisateur **ouvrir MyOsteoFlow desktop**. Deux fichiers, et deux seulement,
doivent tester `plan` (ou un helper) au lieu de `role` :

- `app/api/osteoflow/auth/route.ts` (l. 65)
- `app/api/osteoflow/verify/route.ts` (l. 52)

Plus `lib/osteoflow-auth.ts` (l. ~40) pour la résolution de session côté proxy.

### Conséquence : la release desktop n'est pas bloquante

Un compte `osteoflow` est vu comme `role = 'trial'` par les binaires Electron
déjà installés — un cas qu'ils gèrent **déjà correctement en production
aujourd'hui**. La nouvelle version desktop n'apporte que du confort
(masquage propre des widgets OsteoUpgrade, écran d'upsell). Elle peut sortir
après l'ouverture commerciale.

---

## 3. Phases d'implémentation

Chaque phase est déployable seule, sans changement de comportement observable,
et réversible.

### Phase 0 — Filet de sécurité ✅ appliquée le 19/08/2026

Migrations `20260819_add_profile_plan.sql` et
`20260819_harden_profile_plan_functions.sql`.

- [x] Colonne `profiles.plan` (contrainte CHECK + index) et backfill depuis `role`
- [x] Trigger `trigger_sync_profile_plan_role` — synchronisation **bidirectionnelle**,
      pour que le webhook Stripe et `/admin/users`, qui écrivent encore `role`,
      maintiennent `plan` à jour sans aucun déploiement applicatif
- [x] Helpers `has_osteoflow()` / `has_osteoupgrade()` (SECURITY INVOKER)
- [x] `trigger_create_referral_code_on_premium` écoute désormais `role` **et** `plan` :
      `AFTER UPDATE OF role` ne se déclenche que si la colonne figure dans le `SET`
      de la requête, pas si un trigger BEFORE la modifie — sans cet ajout, une
      écriture portant uniquement sur `plan` (phase 2) aurait silencieusement
      cessé de créer les codes de parrainage
- [x] Migration validée au préalable dans une transaction annulée (8 assertions :
      backfill, chemin hérité, chemin cible, `osteoflow`→`trial`, admin non
      rétrogradé, résiliation, nouvelle inscription, helpers)

Répartition constatée après application (30 comptes, 0 écart) :
`free/free ×21 · premium/bundle ×6 · admin/bundle ×2 · trial/osteoflow ×1`

**Aucun code applicatif ne lit `plan` à ce stade.**
Rollback : `DROP TRIGGER trigger_sync_profile_plan_role`, restaurer
`trigger_create_referral_code_on_premium` sur `UPDATE OF role`, puis
`ALTER TABLE profiles DROP COLUMN plan`.

### Phase 1 — Le code lit `plan` ✅ terminée le 19/08/2026

Tous les comptes valent encore `free` ou `bundle` : le comportement observable
est strictement inchangé, ce qui a été vérifié compte par compte (voir plus bas).

- [x] `lib/entitlements.ts` : `planOf()`, `hasOsteoflow()`, `hasOsteoupgrade()`,
      `entitlementsOf()`, `planLabel()`, `roleToPlan()` / `planToRole()`.
      Module sans dépendance, utilisable serveur et navigateur. Si `plan` est
      absent d'un `select`, `planOf()` retombe sur la dérivation depuis `role`
      — un oubli de colonne dégrade vers le comportement actuel au lieu de
      retirer un accès à tort.
- [x] **Sécurité** — `lib/osteoflow-auth.ts`, `api/osteoflow/auth`,
      `api/osteoflow/verify` : la condition `role IN ('premium','trial','admin')`
      devient `hasOsteoflow(profile)`. C'est le contrôle que `role` ne peut pas
      exprimer, puisque `osteoupgrade` a pour rôle miroir `premium`.
- [x] `auth` et `verify` renvoient `plan` et `entitlements` **en plus** de
      `role`, jamais à la place : les binaires desktop déjà distribués lisent
      et persistent `role`.
- [x] Code d'erreur `PLAN_WITHOUT_OSTEOFLOW` distinct de `SUBSCRIPTION_EXPIRED` :
      un abonné OsteoUpgrade seul a un abonnement actif, lui annoncer une
      expiration serait faux. Le client desktop affiche le message renvoyé et
      traite les codes inconnus comme une invalidation — aucune adaptation
      n'est requise côté binaires existants.
- [x] `api/subscriptions/check-renewals` : le filtre `.eq('role','premium')`
      devient `.in('plan', [...])`. Un abonné MyOsteoFlow seul a pour rôle
      miroir `trial` et n'aurait jamais reçu son rappel de renouvellement.
- [x] `api/profile` expose `plan` ; `components/Navigation.tsx` affiche un badge
      par offre (Gratuit / MyOsteoFlow / OsteoUpgrade / Premium / Admin).
- [x] `api/admin/update-user-role` accepte `plan` (chemin cible) tout en
      conservant `role` (chemin hérité de l'UI admin actuelle).

**Laissé volontairement inchangé** : les endpoints de contenu OsteoUpgrade
(`flashcards/*`, `practice-video`, `literature-review/[id]`, `formations`,
`course-full`, `course-progress`, `submit-quiz`, `ortho-tests`) testent encore
`role IN ('premium','admin')`. Le rôle miroir les rend déjà exacts pour les
quatre offres — les réécrire n'apporterait aucun changement de comportement et
n'ajouterait que du risque. Migration vers `hasOsteoupgrade()` à faire quand
ces fichiers seront ouverts pour une autre raison.

**Vérifications** :
- `tsc --noEmit` propre (base de référence également propre avant modification)
- `next build` complet en succès
- Non-régression mesurée en base sur les 30 comptes réels : pour l'accès
  desktop comme pour le filtre du cron, **aucun écart** entre l'ancienne et la
  nouvelle décision

### Phase 2 — Stripe ✅ terminée le 19/08/2026

**Catalogue Stripe (livemode)** — 4 Price créés, 2 existants alignés. Chaque
Price porte un `lookup_key` et un `metadata.plan`, ce qui rend la résolution
d'offre indépendante de la configuration d'environnement.

- [x] Produits `MyOsteoFlow` (`prod_V6IypGYLNuW3tR`) et `OsteoUpgrade`
      (`prod_V6IyzEUUNnj934`), chacun portant son tarif mensuel et son tarif
      Fondateur annuel
- [x] `metadata.plan` posé sur les deux Price bundle existants (`premium` → `bundle`)

**Code**

- [x] `lib/stripe.ts` : `STRIPE_PLANS` passe de 2 à 6 entrées, typées, chacune
      portant `plan` et `isFounding`. Les clés historiques `premium_monthly` et
      `founding_annual` sont conservées — elles vivent déjà dans les metadata
      des abonnements en cours et dans le front.
- [x] `planFromSubscription()` : résolution en cascade `price.metadata.plan` →
      priceId → metadata de l'abonnement → `bundle`. Le repli final n'est
      jamais `free` : jusqu'ici une seule offre existait, couper l'accès d'un
      abonné non identifiable serait le pire résultat possible.
- [x] `referralFreeMonthAmount(plan)` remplace la constante fixe : un
      parrainage sur MyOsteoFlow seul offre 29,99 €, pas le prix du bundle.
- [x] `api/stripe/checkout` : garde Fondateur généralisée via `plan.isFounding`,
      essai ouvert aux trois offres mensuelles (et toujours unique par compte
      à vie), metadata enrichies de `plan`.
- [x] `api/stripe/webhook` : entièrement piloté par `plan`, plus aucune
      écriture directe de `role`. Écrire `plan` protège au passage un compte
      admin par ailleurs abonné, que l'ancien `role: 'free'` rétrogradait.
- [x] **Changement d'offre géré** dans `customer.subscription.updated` — le
      code n'existait pas. Upgrade et downgrade suivent le prix de
      l'abonnement, et tout changement est tracé par une notification admin :
      un downgrade qui ne retirerait pas les droits serait invisible.

**Deux bugs bloquants trouvés et corrigés**

1. `handleSubscriptionUpdated` et `handleSubscriptionDeleted` détectaient
   l'essai par `role === 'trial'`. Or `trial` est devenu le rôle miroir
   **permanent** de l'offre MyOsteoFlow seul : chaque abonné MyOsteoFlow
   serait passé en accès complet au premier événement Stripe venu. L'état
   d'essai se lit désormais sur `subscription_status`.
2. `referral_transactions.subscription_type` avait une contrainte CHECK
   limitée aux valeurs de l'ancien modèle. L'insertion d'un parrainage validé
   aurait échoué. Migration `20260819_referral_transactions_accept_plans.sql`.

**Vérifications** : `tsc` et `next build` en succès ; résolution d'offre testée
sur 7 cas dont le **payload réel** de l'abonnement en cours (prix legacy sans
metadata, abonnement historique, payload vide) — 7/7.

**Volontairement reporté en phase 3**

- **Configuration du portail Stripe** (`subscription_update`). L'activer
  maintenant permettrait aux abonnés actuels de descendre à 29,99 € avant même
  l'ouverture commerciale. Elle doit être publiée avec la nouvelle grille.
- **Remappage de l'essai en cours** vers `bundle`. À faire **après** le
  déploiement du code : tant que l'ancien webhook tourne, il détecte l'essai
  par `role === 'trial'`, et remapper d'abord lui ferait manquer l'email
  « Passage à Premium » et le crédit de parrainage à la conversion. Le nouveau
  webhook s'en charge de lui-même au prochain événement Stripe.

**Variables d'environnement à ajouter dans Vercel** (les deux premières
existent déjà) :

```
STRIPE_PRICE_OSTEOFLOW_MONTHLY=price_1U66MeEr5HqbRRSrTFTPeiOr
STRIPE_PRICE_OSTEOUPGRADE_MONTHLY=price_1U66MlEr5HqbRRSrrx7lHFan
STRIPE_PRICE_FOUNDING_OSTEOFLOW_ANNUAL=price_1U66MwEr5HqbRRSrl4BvuJVx
STRIPE_PRICE_FOUNDING_OSTEOUPGRADE_ANNUAL=price_1U66N3Er5HqbRRSrb0zwZMfY
```

Leur absence n'empêche pas le webhook de fonctionner (il lit les metadata du
Price), mais elle empêche de créer une session de paiement sur ces offres.

### Phase 3 — Ouverture commerciale ✅ terminée le 19/08/2026

**Source unique des prix** — `lib/offers.ts` porte le catalogue d'affichage
(nom, tarif, arguments, clé Stripe standard et fondateur). Volontairement
séparé de `lib/stripe.ts`, qui instancie le SDK et exige `STRIPE_SECRET_KEY` :
il ne peut donc jamais être importé par un composant client. Plus aucun
« 49,99 € » en dur dans les pages.

- [x] `app/page.tsx` : grille des trois offres, titres et CTA finaux
- [x] `app/settings/subscription/page.tsx` : grille à trois cartes pour les
      comptes sans abonnement, bloc « votre offre actuelle » sinon, et bloc
      d'évolution vers le bundle pour les abonnés MyOsteoFlow ou OsteoUpgrade
      (différence de prix calculée, prorata annoncé)
- [x] Les membres fondateurs voient les trois offres à leur tarif -50 %
- [x] `FreeContentGate`, `FreeUserBanner`, `MyOsteoFlowUpsellModal` : le message
      nomme l'offre manquante. Dire « Premium » à un abonné MyOsteoFlow serait
      faux — ce qui lui manque, c'est OsteoUpgrade.
- [x] `app/dashboard`, `app/settings`, `app/parrainage` : prix et libellés
- [x] `app/cgu` : définitions des trois offres, grille tarifaire complète,
      essai portant sur l'offre choisie, parrainage à montant variable, et
      **nouvel article 5.4 « Changement d'offre »** (effet immédiat, prorata,
      date de renouvellement inchangée)

**Portail client Stripe** — `scripts/setup-portal-configs.ts` crée **deux**
configurations, et `api/stripe/portal` choisit selon `is_founding_member`.
Deux et non une : les tarifs Fondateur vivent sur les mêmes produits Stripe que
les tarifs publics, une grille unique ferait perdre sa remise à vie à un
fondateur qui change d'offre, sans le moindre avertissement. Tant que les
variables ne sont pas renseignées, le portail garde exactement son comportement
actuel (pas de changement d'offre) — l'activation est donc un choix explicite.

**Vérifications** : `tsc` et `next build` en succès ; rendu vérifié compte par
compte sur les 30 profils réels (page abonnement, bandeau d'essai, badge de
navigation) — aucune divergence.

**Un piège évité** : le bandeau d'essai du dashboard est passé de
`role === 'trial'` à `subscription_status === 'trialing'`, mais `/api/profile`
ne renvoyait pas cette colonne — le bandeau aurait disparu silencieusement.
Colonne ajoutée aux deux `select` de la route.

**À faire au déploiement**

1. `npx tsx scripts/setup-portal-configs.ts`, puis reporter les deux
   identifiants dans `STRIPE_PORTAL_CONFIG_PLANS` et
   `STRIPE_PORTAL_CONFIG_PLANS_FOUNDING`.
2. Remapper l'essai en cours vers son offre réelle (reporté depuis la phase 2) :
   `UPDATE profiles SET plan = 'bundle' WHERE subscription_status = 'trialing';`
   — à lancer **après** le déploiement, jamais avant.

### Phase 4a — Correctifs bloquants pour le lancement ✅ terminée le 19/08/2026

Deux défauts que le tout premier abonné MyOsteoFlow-seul aurait rencontrés.

**Parrainage** — migration `20260819_referral_codes_all_plans.sql`. Le
dispositif était adossé au rôle : `trigger_create_referral_code_on_premium` ne
créait un code que pour `premium`/`admin`, et les deux `validate_referral_code`
n'acceptaient comme parrain que ces mêmes rôles. L'offre MyOsteoFlow ayant
`trial` pour rôle miroir, son abonné n'aurait **jamais reçu de code** — et s'il
en avait eu un, il aurait été refusé à l'usage. Tout bascule sur `plan` :
toute offre payante ouvre droit au parrainage. Côté application, même bascule
dans `api/referrals/earnings`, `api/referrals/my-code` et la vérification du
parrain dans `api/stripe/checkout`. Rattrapage inclus pour les abonnés
existants sans code. Les membres fondateurs restent exclus.

**Prix dans les emails** — migration `20260819_email_templates_three_offers.sql`.
Les champs de fusion étaient corrects depuis la phase 2, mais six corps de
templates contenaient « 49,99 € » en dur : un abonné MyOsteoFlow à 29,99 €
aurait reçu un email lui annonçant un prélèvement de 49,99 €. L'email
transactionnel d'essai utilise désormais `{{prix}}` (qui porte le tarif réel,
remise Fondateur et réduction partenaire comprises) ; les emails marketing,
adressés à des comptes sans offre, mentionnent les trois tarifs. Deux libellés
de notification admin encore codés en dur dans le webhook sont également
corrigés.

Validé au préalable dans une transaction annulée. Deux assertions initialement
en échec se sont révélées être des invariants que le système n'a jamais
garantis, et non des régressions : les codes des membres fondateurs existent
mais restent désactivés, et un code reste actif en base après résiliation —
c'est la validation qui le refuse, pas un drapeau.

### Phase 4a-bis — Séquences d'emails par offre ✅ terminée le 19/08/2026

Migration `20260819_emails_par_offre.sql`.

**Le défaut** : le déclencheur `Passage à Premium` partait pour **n'importe
quelle offre payante** et portait trois emails consacrés à MyOsteoflow
(bienvenue + installation, rappel J+7, astuces J+14). Un abonné OsteoUpgrade
seul aurait reçu trois relances sur un logiciel qu'il n'a pas acheté et ne peut
pas ouvrir — le premier partant **immédiatement**, donc dès le premier client.

**Pourquoi une séquence par offre** : le moteur ne fait que du remplacement
`{{variable}}`, sans aucune condition. Impossible de brancher le contenu dans
un template ; il faut des automatisations distinctes, et un événement par
offre émis par le webhook.

| Offre | Immédiat | J+7 | J+21 |
|---|---|---|---|
| MyOsteoFlow | Bienvenue + installation | Rappel installation *(partagé)* | **Upsell OsteoUpgrade** |
| OsteoUpgrade | Bienvenue orientée contenu | Par où commencer | **Upsell MyOsteoFlow** |
| Premium | Séquence existante, inchangée | | |

L'argument d'upsell est le même dans les deux sens : passer de 29,99 à 49,99 €
coûte **20 €** et donne l'autre produit entier, soit **10 €/mois de moins**
que de le prendre séparément. Le bouton renvoie vers la page abonnement, où le
bloc « Changer d'offre » de la phase 3 exécute le changement via Stripe.

`subscriptionEventFor(plan)` route l'événement, à la souscription comme à la
conversion d'un essai. `Passage à Premium` est conservé pour le bundle : cet
événement vit déjà dans les metadata des abonnements en cours.

**Autres correctifs de cohérence**

- Sujets adossés à une offre unique (`essai gratuit MyOsteoflow`,
  `abonnement Premium annulé`) → `{{nom}}`, qui porte l'offre réelle. Le
  webhook transmet désormais `nom` aussi à la résiliation.
- L'email d'essai affirmait que « seul MyOsteoflow est débloqué » — devenu faux
  depuis que l'essai donne l'accès complet à l'offre choisie. Bloc retiré,
  texte réécrit autour de `{{nom}}`.
- **Défaut préexistant corrigé** : les inscriptions en séquence n'étaient
  annulées qu'en cas de désabonnement. Un compte gratuit qui souscrivait
  continuait de recevoir « Passez Premium, débloquez tout » pendant des
  semaines. Nouvelle colonne `mail_automations.stop_on_subscribe`, et
  `cancelProspectSequences()` appelée par le webhook à la souscription.

### Phase 4b — Back-office (en cours)

**Fait — visibilité commerciale et gestion des offres**

- [x] `api/admin/stats` : décompte par offre, **MRR** et panier moyen. Le seul
      chiffre disponible était « premium », qui ne dit plus rien maintenant
      qu'il recouvre le bundle *et* l'offre OsteoUpgrade seule. Les tarifs
      Fondateur (annuels, -50 %) sont mensualisés pour rester comparables ;
      essais et comptes offerts sont comptés dans la répartition mais exclus
      du MRR, comme ils l'étaient déjà du taux de conversion.
- [x] `/admin/stats` : bloc « Répartition par offre » avec part de chacune,
      cartes « Abonnés payants », « MRR » et « Essais en cours »
- [x] `/admin/users` : le sélecteur attribue une **offre** (et non plus un
      rôle), écrit `plan`, et laisse le trigger SQL recalculer le rôle miroir.
      `admin` reste une entrée à part — ce n'est pas une offre. Badges et
      compteurs suivent l'offre ; l'état d'essai vient de `subscription_status`.
- [x] Contrôle : MRR recalculé en SQL sur les données réelles, identique au
      code (199,97 € — 3 abonnés au tarif public, 2 fondateurs mensualisés,
      1 compte offert et 1 essai exclus)
- [x] `api/admin/stripe-portal-setup` : génère les deux configurations du
      portail client depuis l'application, qui dispose déjà de la clé Stripe.
      Le dashboard Stripe ne sait éditer que la configuration par défaut :
      impossible d'y créer la seconde grille, celle des tarifs fondateur.
      **Configurations générées et variables renseignées le 19/08/2026.**
      Le bouton d'interface a été retiré une fois l'opération faite ; la route
      reste disponible pour un futur changement de tarif, déclenchable depuis
      la console du navigateur en étant connecté administrateur (mode d'emploi
      en tête du fichier).

**Fait — mailing et codes de réduction**

- [x] `api/mailing/send` : la segmentation porte sur l'offre. Filtrer sur le
      rôle n'a plus de sens — `premium` recouvre le bundle *et* l'offre
      OsteoUpgrade seule, et `trial` est le rôle miroir permanent de
      MyOsteoFlow. Les anciennes valeurs de rôle restent acceptées pour ne pas
      casser un envoi préparé avec l'ancienne interface.
- [x] `/admin/mailing` : segments « Offre Premium / MyOsteoFlow / OsteoUpgrade
      / Comptes gratuits », et l'aide de `{{prix}}` ne cite plus un tarif unique
- [x] `api/admin/generate-promo` et `api/admin/partner-codes` : les coupons
      étaient restreints au seul prix du bundle (`applies_to.prices`), donc
      inutilisables sur une offre à 29,99 €. Ils couvrent désormais les trois
      tarifs mensuels. Les tarifs Fondateur en restent exclus : déjà à -50 % à
      vie, y empiler une remise cumulerait deux avantages non prévus.
- [x] `/admin/promo` : mention explicite qu'une remise ne dépasse jamais le
      montant du premier prélèvement — un code de 100 € offre un mois entier
      quelle que soit l'offre, et le reliquat est perdu. L'asymétrie de valeur
      entre 49,99 € et 29,99 € doit être connue avant d'envoyer un code.

**Tests orthopédiques — frontière tranchée**

Le contenu de la bibliothèque relève d'OsteoUpgrade, mais l'aide au
raisonnement de MyOsteoFlow peut continuer à **nommer** des tests. Autrement
dit : sans OsteoUpgrade, on sait quel test faire, pas comment ni pourquoi.

| Endpoint | Renvoie | Sans OsteoUpgrade |
|---|---|---|
| `osteoflow/ortho-tests` | nom + **indications** | **403** — c'est la bibliothèque |
| `osteoflow/generate-hypotheses` | nom, région, rationale de l'IA | ouvert — aucune indication n'est renvoyée |
| `osteoflow/suggest-tests` | nom + raisonnement de l'IA | ouvert — même raison |

Le descriptif n'est affiché que dans le sélecteur du formulaire de
consultation, alimenté par `ortho-tests` : le fermer suffit à faire respecter
la frontière, sans toucher aux fonctions vendues avec MyOsteoFlow.

**Transition** : le contrôle ne s'applique **que si le client transmet un
jeton de session**. Les binaires desktop déjà distribués n'envoient que le
secret partagé pour cet endpoint — l'exiger tout de suite couperait les tests
à tous les abonnés, Premium compris, jusqu'à ce que chacun ait mis à jour son
application. Même stratégie que la migration CF2.

**Reste à faire — revu le 20/08/2026**

La liste initiale de la phase 4b a été reprise item par item ; l'essentiel
avait été traité par les phases 4a, 4a-bis et 4b elles-mêmes.

- [x] Contrainte `referral_transactions_subscription_type_check` — corrigée en
      phase 2 (`20260819_referral_transactions_accept_plans.sql`)
- [x] Codes promo et partenaires étendus aux trois offres — phase 4b
- [x] `/admin/users`, `/admin/stats`, `/admin/mailing` — phase 4b
- [x] Emails de bienvenue différenciés par offre — phase 4a-bis
- [x] `20260708_disable_referral_for_founding_members.sql` — **rien à revoir** :
      vérifié en base, les membres fondateurs ont bien un code mais désactivé,
      ce qui est le comportement voulu. `20260819_referral_codes_all_plans.sql`
      a ouvert le parrainage aux trois offres sans toucher à cette exclusion.
- [x] `/admin/broadcasts` et `/admin/automations` — **rien à segmenter** :
      les diffusions ciblent une *application* (`osteoflow` / `osteoupgrade` /
      les deux), pas une offre, et les automatisations n'ont pas d'audience :
      elles réagissent à un événement. La segmentation par offre se joue dans
      l'événement émis (`subscriptionEventFor`), déjà fait en phase 4a-bis.
- [x] `scripts/setup-email-automations.ts` — script d'amorçage **obsolète**
      (offres « Premium Silver / Gold », prix codés en dur). Il n'a pas été
      mis à jour mais **neutralisé** : le rejouer dupliquerait les
      automatisations en production. Garde explicite en tête d'exécution,
      contournable par `AUTORISER_SCRIPT_OBSOLETE=oui`.
- [ ] **Emails de changement d'offre** (upgrade / downgrade). Seul reste réel :
      un changement depuis le portail met l'accès à jour et notifie l'admin,
      mais le client ne reçoit que la facture Stripe. Demande une automatisation
      par sens de changement (le moteur ne fait pas de conditionnel).

### Phase 4c — Cohérence de l'affichage par offre ✅ terminée le 20/08/2026

Le back-office et la facturation étaient justes, le **dashboard du site** ne
l'était pas : il gate encore sur `role`, dont le miroir ne peut pas exprimer
les nouvelles offres.

- [x] Section « MyOsteoFlow — Logiciel de cabinet » : `role IN (premium, admin,
      trial)` → `hasOsteoflow()`. `plan = 'osteoupgrade'` se miroite en
      `premium` : le compte se voyait proposer les trois liens de
      téléchargement d'un logiciel qu'il ne peut pas ouvrir. Il aurait
      installé l'application pour être accueilli par `PLAN_WITHOUT_OSTEOFLOW`.
- [x] Même section, libellé : `role === 'trial'` affichait « Inclus avec votre
      essai gratuit » — désormais faux pour un abonné MyOsteoFlow payant, dont
      c'est le rôle miroir permanent. L'essai se lit sur `subscription_status`,
      et le libellé nomme l'offre.
- [x] Espace Ambassadeur : `role IN (premium, admin)` → toute offre payante.
      La phase 4a a donné un code de parrainage à l'abonné MyOsteoFlow ; le
      dashboard ne le lui montrait pas, et ne l'appelait même pas.
- [x] Bloc verrouillé MyOsteoFlow : affiché pour toute absence du droit, et
      plus seulement aux comptes gratuits — un abonné OsteoUpgrade seul ne
      voyait rien du tout de l'autre produit.
- [x] Nouveau bloc symétrique au-dessus du hub d'apprentissage pour un abonné
      MyOsteoFlow seul : les modules restent visibles, mais on dit avant le
      clic pourquoi ils sont verrouillés, plutôt qu'après.
- [x] `components/UpsellBundleCard.tsx` : proposition de passage au bundle pour
      les deux offres simples. Carte en coin d'écran, jamais bloquante ; muette
      pendant un essai (qui a déjà son bandeau), reportée 14 jours au refus,
      définitivement close sur « Ne plus me proposer ». Ce sont des clients
      payants : leur barrer la page se paierait en résiliations.
- [x] Essai et changement d'offre : le portail était en
      `trial_update_behavior: 'end_trial'` — changer d'offre pendant l'essai y
      mettait fin et déclenchait le prélèvement sur-le-champ. Le 20/08/2026 un
      abonné a perdu ses 7 jours gratuits pour être passé de Premium à
      OsteoUpgrade **trois minutes** après avoir souscrit. Un avertissement
      avait d'abord été ajouté sur `/settings/subscription`, mais il ne pouvait
      rien : le changement se fait dans le portail, chez Stripe, où nos écrans
      n'existent pas. Les deux configurations sont passées en
      `continue_trial` — l'essai se poursuit, le nouveau tarif s'applique à son
      terme — et le texte de la page dit désormais l'inverse de ce qu'il
      annonçait. `trial_used_at` empêchant déjà tout second essai, il n'y avait
      rien à protéger.
- [x] `planTypeFromSubscription()` (`lib/stripe.ts`) : l'email de conversion
      d'essai lisait le tarif dans `subscription.metadata.planType`, figé au
      checkout. Après un changement d'offre pendant l'essai, il annonçait
      l'ancienne offre et son ancien prix. Le tarif se lit désormais sur le
      prix réellement porté par l'abonnement.

**Simulation d'offre pour l'administration** — `lib/plan-simulation.ts`,
`api/admin/simulate-plan`, `components/PlanSimulationBanner.tsx`, entrée dans
`/admin`.

Basculer son propre rôle en base ne permet pas de tester : écrire `plan` sur un
compte admin ne change rien (le trigger ne rétrograde jamais un admin, et tous
les helpers comme les policies RLS court-circuitent sur `admin`), et écrire
`role` fait perdre `/admin` — sans même donner accès à l'offre OsteoUpgrade
seule, qu'**aucune valeur de rôle ne peut représenter** (`premium` se dérive en
`bundle`, `trial` en `osteoflow`). La simulation vit dans un cookie honoré par
`/api/profile` pour les seuls comptes réellement `admin`, n'écrit rien, expire
en 4 h et s'annule d'un clic depuis un bandeau permanent. C'est une simulation
d'**affichage** : la base continue de servir le contenu à un administrateur.

### Phase 5 — Release desktop ✅ code terminé le 19/08/2026

Dépôt `Osteoflow`, branche `claude/pricing-strategy-products-72ldtv`,
**version 1.18.0**. Reste à builder, signer et notariser.

- [x] `src/lib/entitlements.ts` + `src/hooks/use-entitlements.ts` (9 tests)
- [x] `src/app/api/license/route.ts` : stocke `license_entitlements`
- [x] `src/app/api/license/online-verify/route.ts` : entitlements persistés au
      heartbeat 30 min — un changement d'offre s'applique sans reconnexion
- [x] `src/app/(auth)/osteoupgrade/page.tsx` et `license-guard.tsx` : le code
      `PLAN_WITHOUT_OSTEOFLOW` donne un message juste, au lieu d'annoncer un
      abonnement expiré à un abonné parfaitement actif
- [x] Masquage des widgets OsteoUpgrade + `osteoupgrade-upsell.tsx`
- [x] `ortho-tests` : le proxy transmet les en-têtes de session, et le bouton
      « Tests orthos » du formulaire de consultation suit le droit
- [x] `electron/main.ts` : payload inchangé, rien à faire

---

## 4. Migration des utilisateurs existants

- Tous les `premium` actuels deviennent `bundle` **sur leur price ID actuel** :
  aucun changement de prix, aucune action Stripe, grandfathering automatique.
- Les `trial` en cours deviennent `osteoflow` + `subscription_status='trialing'`
  (comportement identique à aujourd'hui).
- Script de réconciliation Supabase ↔ Stripe : vérifier que chaque
  `stripe_subscription_id` pointe bien vers le price attendu par `plan`.
- Email d'annonce aux abonnés : leur offre et leur prix ne changent pas.

---

## 5. Points de vigilance production

1. **Endpoints IA sans contrôle de rôle** — `ai/*`, `transcribe`,
   `generate-hypotheses`, `suggest-tests`, `generate-letter`,
   `letter-templates`, `hypotheses-sync` ne sont protégés que par le secret
   partagé `OSTEOFLOW_PROXY_SECRET`, sans vérification par utilisateur.
   Acceptable aujourd'hui (l'accès passe par le login desktop), mais à durcir :
   ce sont des appels payants à Groq/Anthropic.
2. **`widgets` et `broadcasts`** sont également secret-only et servent du
   contenu OsteoUpgrade en teaser sur le dashboard desktop. Acceptable
   (c'est de l'upsell), à confirmer.
3. **Webhook Stripe** : le changement de price n'est pas traité →
   un downgrade laisserait l'ancien entitlement actif. Bloquant pour la Phase 3.
4. **Binaires desktop en circulation** : ne jamais retirer ni changer la
   sémantique du champ `role` renvoyé par `/api/osteoflow/verify`.
5. **Ordre strict** : aucune vente d'offre non-bundle avant la fin de la Phase 2.

---

## 6. Recette

Matrice à couvrir : 4 plans × (site, desktop, API, RLS), plus le rôle `admin`.

Transitions à tester explicitement :
`free → chaque offre` · `osteoflow ↔ bundle` · `osteoupgrade ↔ bundle` ·
`osteoflow ↔ osteoupgrade` · résiliation depuis chaque offre ·
essai → conversion payante · essai → abandon.
