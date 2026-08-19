# Passage à 3 offres — plan d'implémentation

Statut : **phase 0 appliquée en production le 19/08/2026** — phases 1 à 5 à venir
Contrainte majeure : **le site et l'application desktop sont en production.**
Aucune phase ne doit modifier le comportement des utilisateurs existants.

---

## 1. Les offres

| Offre | Contenu | Prix | Price ID Stripe |
|---|---|---|---|
| **Bundle** (actuelle) | OsteoUpgrade + MyOsteoFlow | 49,99 €/mois | `STRIPE_PRICE_PREMIUM_MONTHLY` (existant, inchangé) |
| **MyOsteoFlow seul** | Application cabinet + IA | 29,99 €/mois | `STRIPE_PRICE_OSTEOFLOW_MONTHLY` (à créer) |
| **OsteoUpgrade seul** | E-learning, pratique, flashcards, tests | 29,99 €/mois | `STRIPE_PRICE_OSTEOUPGRADE_MONTHLY` (à créer) |

Remise bundle : 59,98 → 49,99 €, soit **−17 %** (argument commercial à afficher).

### Offre Fondateur (−50 %, annuelle)

Les membres fondateurs choisissent l'offre de leur choix, toujours à −50 % :

| Offre fondateur | Prix | Price ID |
|---|---|---|
| Bundle | 299,94 €/an | `STRIPE_PRICE_FOUNDING_ANNUAL` (existant) |
| MyOsteoFlow seul | 179,94 €/an | `STRIPE_PRICE_FOUNDING_OSTEOFLOW_ANNUAL` (à créer) |
| OsteoUpgrade seul | 179,94 €/an | `STRIPE_PRICE_FOUNDING_OSTEOUPGRADE_ANNUAL` (à créer) |

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

### Phase 1 — Le code lit `plan` (tous les comptes sont encore `free`/`bundle`)

- [ ] `lib/entitlements.ts` : helpers `hasOsteoflow()`, `hasOsteoupgrade()`,
      `planLabel()`, partagés serveur/client
- [ ] **Sécurité** : `api/osteoflow/auth`, `api/osteoflow/verify`,
      `lib/osteoflow-auth.ts` → basculer sur les entitlements
- [ ] `verify` renvoie un champ `entitlements` **en plus** de `role`
      (jamais à la place — les vieux binaires lisent `role`)
- [ ] Message d'erreur dédié pour un compte OsteoUpgrade-seul qui tente le desktop
      (nouveau code `PLAN_WITHOUT_OSTEOFLOW`)
- [ ] `api/subscriptions/check-renewals` : le filtre `.eq('role','premium')`
      raterait les abonnés `osteoflow`
- [ ] `components/Navigation.tsx` : badges (`free`/`premium`/`admin` en dur)
- [ ] `api/admin/update-user-role` : whitelist `['free','trial','premium','admin']`
- [ ] Contrôle de non-régression : comportement strictement identique tant que
      `plan ∈ {free, bundle}`

### Phase 2 — Stripe (offres créées mais non vendues)

- [ ] Créer les 4 nouveaux Price dans Stripe (2 mensuels + 2 fondateurs annuels)
- [ ] `lib/stripe.ts` : `STRIPE_PLANS` passe de 2 à 6 entrées, chacune portant
      `plan` et `entitlements`
- [ ] Table de correspondance **`priceId → plan`** (source de vérité du webhook,
      plus robuste que les metadata)
- [ ] `api/stripe/webhook` : mapping du plan (l. 387 `role: … ? planType : 'free'`
      et l. 770 sur `subscription.deleted`)
- [ ] `api/stripe/webhook` : **gérer le changement de price** dans
      `customer.subscription.updated` — non géré aujourd'hui, indispensable pour
      les upgrades/downgrades
- [ ] `describePlanPricing()` : prix affichés dans les emails de bienvenue
- [ ] `api/stripe/checkout` : éligibilité essai (aujourd'hui
      `planType === 'premium_monthly'` en dur, l. ~145) + garde fondateur étendue
      aux 3 offres fondateur
- [ ] `REFERRAL_FREE_MONTH_AMOUNT` → montant variable selon le plan du filleul
- [ ] Remapper les essais en cours (`subscription_status = 'trialing'`) vers le
      plan réellement souscrit — la phase 0 les a backfillés en `osteoflow`
      pour préserver le comportement actuel
- [ ] Recette sur un compte interne en test mode, sur les 6 prix

### Phase 3 — Ouverture commerciale (UI + juridique)

- [ ] `app/page.tsx` : refonte section Tarifs (l. 1170-1310) → 3 cartes ;
      « 49,99 €/mois » en dur à 5 endroits du fichier
- [ ] `app/settings/subscription/page.tsx` (706 l.) : conçue pour une offre
      unique — affichage de l'offre courante, 3 CTA, upgrade/downgrade
- [ ] `components/FreeContentGate.tsx`, `FreeUserBanner.tsx`,
      `MyOsteoFlowUpsellModal.tsx` : messages selon l'entitlement manquant
- [ ] `app/dashboard/page.tsx`, `app/settings/page.tsx` : prix en dur
- [ ] Page/section « Comparer les offres »
- [ ] `app/cgu/page.tsx` : CGU/CGV mentionnent le tarif unique
- [ ] Portail Stripe : configuration `subscription_update` avec les 3 prix
      (`api/stripe/portal`)

### Phase 4 — Emails, parrainage, admin

- [ ] Templates SQL avec prix en dur :
      `20260616_update_pricing_referral_emails.sql`,
      `20260616_fix_remaining_email_prices.sql`,
      `20260715_trial_email_automations.sql`,
      `20260616_cleanup_referral_payout_emails.sql`
- [ ] `scripts/setup-email-automations.ts`
- [ ] Emails de bienvenue différenciés + nouveaux : upgrade, downgrade, offre modifiée
- [ ] Parrainage : `api/referrals/*`, `app/parrainage/page.tsx`,
      `app/settings/referrals/page.tsx` ; trigger `create_referral_code_for_premium`
      et les deux `validate_referral_code` (1 et 2 arguments) — étendre la
      condition `WHEN` du trigger pour couvrir `plan = 'osteoflow'`
- [ ] Contrainte `referral_transactions_subscription_type_check`
      (n'accepte que `premium_silver|premium_gold|premium`)
- [ ] Codes promo `/admin/promo` (−100 € pensé pour l'ancien Gold) et
      partenaires `/admin/partners` : à étendre aux trois offres
- [ ] `20260708_disable_referral_for_founding_members.sql` à revoir
- [ ] `/admin/users` : affichage et édition de l'offre
- [ ] `/admin/stats` + `api/admin/stats` : MRR et conversion par offre
      (aujourd'hui un simple compteur `premium`)
- [ ] `/admin/mailing`, `/admin/broadcasts`, `/admin/automations` : segmentation

### Phase 5 — Release desktop (non bloquante)

- [ ] `src/app/api/license/route.ts` : stocker les entitlements, pas seulement
      `license_role`
- [ ] `src/app/api/license/online-verify/route.ts` : persister les entitlements
      du heartbeat 30 min
- [ ] `src/app/(auth)/osteoupgrade/page.tsx` : message clair pour un compte
      sans MyOsteoFlow
- [ ] `src/components/layout/license-guard.tsx` : gérer le nouveau code d'erreur
- [ ] Masquage/verrouillage des widgets OsteoUpgrade :
      `osteoupgrade-widgets.tsx`, `flashcards-widget.tsx`, `video-widget.tsx`,
      `literature-review-modal.tsx`, `dashboard.tsx`
- [ ] Écran d'upsell in-app « Ajouter OsteoUpgrade »
- [ ] `electron/main.ts` si le payload du heartbeat évolue

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
