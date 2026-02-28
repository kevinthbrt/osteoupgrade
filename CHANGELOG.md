# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [Unreleased] — 2026-02-28

### Corrigé

- **Quiz — Verrouillage inter-chapitres** (`app/elearning/cours/page.tsx`)
  La fonction `isSubpartAccessible` ne propageait pas le verrou d'un chapitre à l'autre :
  si le sous-partie B1 du chapitre 2 était précédée par A2 (sans quiz), elle restait accessible
  même si A1 (avec quiz) n'était pas validé. Remplacée par `computeAccessibleSubparts` qui
  calcule un `Set<string>` d'IDs accessibles en chaîne : chaque sous-partie n'est accessible
  que si la précédente l'est ET que son quiz éventuel est passé.

- **Quiz — Données vides pour les comptes free** (`supabase/migrations/20260228_free_user_quiz_access.sql`)
  Les politiques RLS sur `elearning_quizzes`, `elearning_quiz_questions` et
  `elearning_quiz_answers` n'autorisaient que les rôles `premium_silver`, `premium_gold` et
  `admin` à lire les données. Pour les comptes `free`, Supabase retournait des tableaux vides,
  `quiz_passed` était toujours `true` et aucun chapitre n'était verrouillé.
  Nouvelles politiques : tout utilisateur authentifié peut lire les données de quiz si la
  formation parente a `is_free_access = true` (join `quiz → subpart → chapter → formation`).

### Ajouté

- **Navigation — Accès free aux sections E-Learning / Pratique / Outils** (`components/Navigation.tsx`)
  Suppression des restrictions de rôle (`roles`) sur les groupes E-Learning et Outils ainsi que
  sur l'item Pratique. Les utilisateurs free peuvent désormais naviguer vers ces pages ; le
  contenu est géré individuellement via `FreeContentGate` dans chaque page. Les Séminaires
  restent réservés aux membres Gold et Admin.

- **Navigation — Bouton "Passer Premium" doré pour les free** (`components/Navigation.tsx`)
  Un bouton animé doré s'affiche en bas de la sidebar uniquement pour les comptes `free`,
  avec un lien direct vers `/settings/subscription`.

- **Dashboard — Bandeau d'upgrade Premium pour les free** (`app/dashboard/page.tsx`)
  Un bandeau doré s'affiche entre le bloc gamification et les modules d'apprentissage pour
  les comptes `free`, avec un CTA vers la page d'abonnement.

- **Revue de littérature — Floutage des articles non-épaule pour les free** (`app/elearning/revue-litterature/page.tsx`)
  Les articles dont les tags ne contiennent pas "épaule" sont maintenant floutés via
  `FreeContentGate` pour les utilisateurs `free`. S'applique à l'article vedette et à
  toutes les cartes de la grille.
