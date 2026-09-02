# Funnels — pages de vente éditables

Pages de vente autonomes servies sur `/f/<slug>`, créées et modifiées depuis
**Administration → Funnels**, sans redéploiement.

## Pourquoi dans l'application plutôt qu'un outil externe

L'infrastructure qu'un LearnyBox ou un ClickFunnels apporte existe déjà ici :
paiement Stripe, moteur de séquences email (`mail_automations`), codes promo,
parrainage, base de contacts. Un outil externe aurait imposé de synchroniser
deux bases de contacts et deux catalogues d'offres. Il ne manquait que la
couche « pages » — c'est ce que fait ce module.

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

`hero`, `video`, `benefits`, `testimonials`, `curriculum`, `pricing`,
`guarantee`, `faq`, `cta`, `optin`, `text`.

Le contenu est un tableau JSONB : ajouter un type de bloc ne demande pas de
migration, seulement une entrée dans `funnelBlockSchema` (validation), dans
`BlockEditor` (saisie) et dans `FunnelRenderer` (affichage).

Les textes sont rendus **comme du texte** — le HTML n'est jamais interprété.
Les sauts de ligne sont conservés. Les vidéos ne sont chargées que depuis Vimeo
et YouTube (`safeEmbedUrl`).

## Échéance de l'offre

Trois modes :

- **`none`** — pas de compte à rebours.
- **`fixed`** — même date pour tout le monde. C'est le modèle CFPCO : une
  session qui ferme.
- **`relative`** — J+N après l'opt-in, propre à chaque lead. C'est le modèle
  adapté à un abonnement permanent : la page reste en ligne, mais l'offre du
  visiteur expire. Le décompte n'apparaît qu'après l'inscription — avant, il
  n'y a rien à décompter.

Un renvoi du formulaire ne repousse pas l'échéance : sinon il suffirait de se
réinscrire pour rouvrir une offre fermée.

## Séquence email

Chaque opt-in déclenche les automatisations dont le `trigger_event` vaut
`funnel:<slug>`. Le déclencheur exact est affiché et copiable dans l'éditeur.

La séquence elle-même se crée dans **Administration → Automatisations**, comme
n'importe quelle autre. Aucun code à écrire pour lancer une campagne.

Le contact est créé dans `mail_contacts` par `triggerAutomations` — la même
fonction que l'inscription et le passage Premium. Il n'y a donc qu'une seule
liste de diffusion, et les règles existantes (désabonnement,
`stop_on_subscribe`) s'appliquent sans traitement particulier.

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
le paiement dès le compte créé — le visiteur n'a pas à retrouver l'offre qu'il
venait d'accepter.

Si le funnel n'a pas d'offre configurée mais contient un bloc `optin`, les CTA
« souscription » basculent automatiquement vers le formulaire email.

## Sécurité

- Les trois tables n'ont **aucune** politique `anon` : rien n'est lisible depuis
  le navigateur. La page publique est rendue côté serveur avec la clé
  service-role, qui filtre sur `status = 'published'`. Un brouillon n'est jamais
  servi, même en devinant son slug.
- `/api/funnels/lead` et `/api/funnels/track` sont publics mais limités en débit
  et refusent un funnel non publié.
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

- Un visiteur `anon` ne lit aucune ligne de `funnels`, même publiée — le rendu
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
