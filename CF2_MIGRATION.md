# CF2 — Migration de l'auth osteoflow (secret partagé → jeton de session)

Objectif : ne plus dépendre d'un **secret partagé codé en dur** + d'un **email de confiance** pour les endpoints `/api/osteoflow/*`, mais d'un **jeton de session personnel** (déjà émis au login, stocké dans `osteoflow_sessions`).

## Plan en 3 étapes (rétro-compatible, zéro coupure)

### ✅ Étape 1 — Serveur "tolérant" (FAIT, côté osteoupgrade)
- Nouveau helper `lib/osteoflow-auth.ts` → `getOsteoflowSessionUser(req)` : valide les en-têtes `x-osteoflow-token` + `x-osteoflow-device-id` contre `osteoflow_sessions`, et renvoie l'identité **dérivée de la session** (jamais d'un email fourni par le client).
- Intégré (chemin jeton **dormant**, secret inchangé en repli) dans les endpoints de données par-utilisateur :
  `flashcards/cards`, `flashcards/decks`, `flashcards/review`, `course-progress`, `course-full`, `formations`, `mark-complete`, `submit-quiz`, `broadcasts/[id]/seen`.
- **Aucun impact clients** : tant que le desktop n'envoie pas ces en-têtes, les endpoints retombent exactement sur l'ancienne vérification par secret. Comportement strictement identique.
- Endpoints restants encore sur secret seul (à migrer plus tard, IDOR plus faible) : `support`, `support/[id]/messages`, `import-csv`, et les endpoints IA/contenu.

**Comment vérifier que rien ne casse** : déployer en preview Vercel, puis ouvrir l'app desktop **actuelle** (non modifiée) → tout doit fonctionner comme avant (elle utilise le secret).

### ⏭️ Étape 2 — Le desktop envoie son jeton (prochaine version de l'app)
Côté osteoflow, ajouter sur chaque appel `/api/osteoflow/*` les en-têtes :
`x-osteoflow-token: <license_token>` et `x-osteoflow-device-id: <license_device_id>` (déjà présents dans `app_config`).
Comme l'étape 1 accepte les deux méthodes, toutes les combinaisons (vieille/nouvelle app × serveur) fonctionnent. À tester sur un build desktop avant publication.

### ⏭️ Étape 3 — Fermeture de la faille (semaines plus tard)
Une fois (quasi) tous les clients sur la nouvelle version :
- Retirer le repli par secret + **supprimer les valeurs `a8c0fcc6…` codées en dur** des deux dépôts.
- Faire tourner (rotation) le secret devenu inutile.
Pour savoir quand c'est sûr : ajouter un compteur temporaire (méthode jeton vs secret) dans les logs serveur.

## Fichiers (étape 1)
- **Nouveau** : `lib/osteoflow-auth.ts`
- **Modifiés** : `app/api/osteoflow/{flashcards/cards,flashcards/decks,flashcards/review,course-progress,course-full,formations,mark-complete,submit-quiz,broadcasts/[id]/seen}/route.ts`

_Typecheck complet : 0 erreur. Rien retiré de l'ancien fonctionnement._
