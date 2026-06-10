# Étude des coûts — OsteoUpgrade & MyOsteoflow

**Document préparé pour la comptabilité** · Juin 2026
Périmètre : site web **www.osteo-upgrade.fr** (OsteoUpgrade) + application de bureau **MyOsteoflow**

---

## 1. Vue d'ensemble du projet

Le projet repose sur deux produits vendus en un seul abonnement :

| Produit | Nature | Rôle |
|---|---|---|
| **OsteoUpgrade** | Site web (SaaS) | Plateforme de formation continue pour ostéopathes : cours e-learning, vidéos de techniques, tests orthopédiques, flashcards, revue de littérature |
| **MyOsteoflow** | Application de bureau (Windows/macOS) | Logiciel de gestion de cabinet : patients, consultations, facturation, comptabilité, emails — données stockées localement chez le praticien |

**Modèle de revenus** (encaissé via Stripe) :

| Offre | Prix TTC client | Remarque |
|---|---|---|
| Gratuit | 0 € | Accès limité (module Épaule uniquement) |
| Premium mensuel | **35 €/mois** | Accès complet aux deux outils |
| Premium annuel | **299 €/an** | Soit 24,92 €/mois (~29 % de remise) |
| Programme de parrainage | −10 % | Commission de 10 % reversée au parrain sur chaque abonnement annuel parrainé (seuil de virement : 50 €) |

---

## 2. Coûts récurrents — situation actuelle (constatée en juin 2026)

Les abonnements aux services techniques ont été vérifiés directement quand c'était possible. Les lignes marquées « à confirmer » dépendent d'un compte externe auquel je n'ai pas accès (relevés bancaires ou factures fournisseur à rapprocher).

### 2.1 Coûts fixes

| Service | Usage | Plan constaté/estimé | Coût mensuel | Coût annuel |
|---|---|---|---|---|
| **Vercel** (hébergement du site) | Hébergement, déploiement, stockage de fichiers (Blob), tâches planifiées | Plan **Hobby (gratuit)** — vérifié | 0 € | 0 € |
| **Supabase** (base de données) | Base PostgreSQL, comptes utilisateurs, authentification | Plan **Free (gratuit)** — vérifié | 0 € | 0 € |
| **Nom de domaine** osteo-upgrade.fr | Adresse du site | Renouvellement annuel .fr | ~1 €/mois | **~8–15 €/an** — à confirmer (registrar) |
| **Vimeo** (hébergement vidéo) | ~250 vidéos de cours et de techniques | Plan payant probable (Starter/Standard) | **~12–33 €/mois** — à confirmer | ~144–400 €/an |
| **Resend** (envoi d'emails) | Emails transactionnels et automatisations (~760 contacts) | Free (3 000 emails/mois) ou Pro (20 $/mois) | 0–19 € — à confirmer | 0–230 € |
| **Systeme.io** (marketing) | Clé API présente — usage à confirmer | Free (< 2 000 contacts) ou payant dès ~27 €/mois | 0–27 € — à confirmer | 0–324 € |
| **Cloudflare Workers** | Questionnaires de suivi patients (J+7) de MyOsteoflow | Free (largement suffisant) | 0 € | 0 € |
| **GitHub** | Code source + distribution des mises à jour de MyOsteoflow | Gratuit | 0 € | 0 € |
| **Groq** (transcription vocale) | Dictée vocale dans MyOsteoflow (modèle Whisper) | Free (7 200 s/jour offertes) | 0 € | 0 € |
| **Apple Developer** | Signature de l'application macOS | 99 $/an **si distribution Mac signée** — à confirmer | ~8 €/mois | ~92 €/an |

### 2.2 Coûts variables (proportionnels à l'activité)

| Service | Usage | Tarification | Estimation actuelle |
|---|---|---|---|
| **Stripe** (paiements) | Commission sur chaque encaissement | ~1,5 % + 0,25 € par transaction (cartes européennes ; plus élevé pour cartes hors UE) | Ex. : sur un abonnement annuel de 299 € → ~4,75 € de frais |
| **Anthropic — API Claude** (IA) | Structuration des notes cliniques, suggestions de tests, génération d'exercices et de courriers dans MyOsteoflow | Paiement à l'usage (modèle Haiku, optimisé avec cache) | Quelques €/mois au volume actuel ; croît avec le nombre d'utilisateurs actifs |

### 2.3 Synthèse — coût actuel

| Scénario | Mensuel | Annuel |
|---|---|---|
| **Fourchette basse** (services gratuits confirmés, Vimeo Starter, sans Apple) | **~15 €/mois** | **~190 €/an** |
| **Fourchette haute** (Vimeo Standard, Resend Pro, Systeme.io payant, Apple Developer) | **~90 €/mois** | **~1 080 €/an** |

> Le projet tourne aujourd'hui essentiellement sur les paliers gratuits des fournisseurs : la structure de coûts est très légère. Les seuls postes certains sont le domaine, l'hébergement vidéo Vimeo, l'IA à l'usage et les commissions Stripe.

---

## 3. Coûts projetés en cas de croissance

Les paliers gratuits ont des limites. Au-delà (~plus de 50–100 abonnés actifs), il faudra prévoir :

| Service | Déclencheur du passage payant | Nouveau coût |
|---|---|---|
| **Vercel Pro** | Usage commercial / trafic accru / dépassement des limites Hobby | ~19 €/mois (20 $) |
| **Supabase Pro** | Base > 500 Mo ou besoin de sauvegardes quotidiennes | ~24 €/mois (25 $) |
| **Resend Pro** | > 3 000 emails/mois | ~19 €/mois (20 $) |
| **Anthropic (IA)** | Croît linéairement avec l'usage de la dictée et des générations IA | ~0,5–2 €/utilisateur actif/mois (estimation) |
| **Stripe** | Proportionnel au chiffre d'affaires | ~1,6 % du CA encaissé |

**Projection « régime de croisière » (~100 abonnés)** : environ **120–200 €/mois** de coûts techniques (hors commissions Stripe), à comparer à un revenu mensuel d'environ 2 500–3 000 € à ce volume — soit une marge technique supérieure à 90 %.

---

## 4. Points d'attention pour la comptabilité

1. **Factures à collecter** auprès de : Vimeo, registrar du domaine (.fr), Resend, Systeme.io, Anthropic, Groq, Apple (si applicable), Stripe (relevés de frais).
2. **Stripe** : les frais sont déduits à la source — le virement reçu est net de commission. Les relevés mensuels Stripe détaillent CA brut / frais / net, indispensables pour le rapprochement.
3. **Commissions de parrainage** : 10 % reversés aux parrains par virement (seuil 50 €) — à traiter comme charges (commissions d'apporteurs d'affaires).
4. **Codes promo** : remises de −100 € sur l'abonnement annuel possibles via Stripe — le CA encaissé peut différer du tarif catalogue.
5. **Abonnements en devises** : Vercel, Supabase, Resend, Anthropic et Apple facturent en dollars US — écarts de change possibles.
6. **TVA** : les fournisseurs américains (Vercel, Supabase, etc.) relèvent du régime d'autoliquidation de TVA sur services B2B intracommunautaires/extracommunautaires — à vérifier avec le statut de l'entreprise.

---

*Document généré à partir de l'analyse du code source des deux projets et de la vérification directe des comptes Vercel et Supabase. Les montants « à confirmer » doivent être rapprochés des factures réelles.*
