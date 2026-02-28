# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [1.2.0] — 2026-02-28

### Ajouté

- **Comptes free — navigation débloquée** : E-Learning, Pratique et Outils accessibles depuis la sidebar ; le contenu premium reste flouté page par page via `FreeContentGate`.
- **Comptes free — "Passer Premium"** : bouton doré animé dans la sidebar et bandeau d'upgrade sur le dashboard.
- **Revue de littérature** : articles non-épaule floutés pour les comptes free (cohérence avec Pratique et Tests).

### Corrigé

- **Quiz — verrouillage inter-chapitres** : `isSubpartAccessible` ne propageait pas le verrou entre chapitres. Remplacé par `computeAccessibleSubparts` (Set propagé). (`app/elearning/cours/page.tsx`)
- **Quiz — données vides pour les free** : politiques RLS trop restrictives empêchaient les comptes free de lire les quizzes. Nouvelle migration `20260228_free_user_quiz_access.sql` : les free peuvent lire les quizzes des formations `is_free_access = true`.
- **Pratique — `isVideoLocked` manquant** : variable perdue lors du merge avec conflit, corrigée dans la foulée.

---

## [1.1.0] — 2026-02-28

### Ajouté

- **Parrainage** : page `/parrainage` dédiée accessible à tous, contenu adapté au rôle (Gold : code + gains + cagnotte ; Silver : teasing Gold ; Free : CTA offres). Lien dans la navigation pour tous.
- **Admin — Codes promo** : page `/admin/promo` pour générer des codes Stripe -100€ sur Gold (personnalisable, nb d'utilisations, barre de progression, désactivation).
- **Checkout Stripe** : champ code promo visible lors du paiement (`allow_promotion_codes`).
- **Parrainage avant paiement** : rappel de code affiché avant redirection Stripe, passage sans code possible.
- **Miniatures Vimeo** : récupération serveur via oEmbed (`vimeo_id`, `thumbnail_url`, `duration_seconds`) pour éviter les cartes noires.
- **Module Pratique** : lecteur vidéo en modal, formulaire admin en modal, gestion catégories en modal, onglets régions avec retour à la ligne, pagination (12/page), région "Bassin", fusion "Pied & Cheville".
- **Footer** : présent sur toutes les pages avec liens légaux (Mentions légales, CGU/CGV, Confidentialité).
- **Bandeau cookies RGPD** : consentement à la première visite, mémorisé en localStorage.
- **Liens légaux** dans la sidebar sous le bouton déconnexion.
- **Mot de passe oublié** : lien sur l'écran de connexion + page dédiée.
- **Fenêtre changelog admin** : popup automatique à chaque mise à jour pour les administrateurs.
- **Tests orthopédiques** ajouté dans la navigation E-Learning.

### Amélioré

- **CGU** : tarifs corrects (Silver 29€/mois ou 240€/an, Gold 499€/an), suppression engagement 12 mois, section Programme Ambassadeur Gold.
- **Emails** : tarifs et conditions alignés avec les CGU.
- **Module Pratique** : ordre d'affichage automatique si champ laissé vide.
- **Page abonnement** : section parrainage enrichie selon le rôle.
- **Parrainage Silver mensuel** : codes non proposés sur l'offre mensuelle.

### Corrigé

- Sécurité — trigger gamification passé en `SECURITY DEFINER` (erreur 403 progression vidéo).
- CSP — autorisation du widget Vercel Live.
- Programme ambassadeur — virement bancaire dès 50€ cumulés (pas un crédit plateforme).
- Revue de littérature — retours à la ligne respectés dans l'affichage des articles.
- Module Pratique — bug qui chargeait toujours la première vidéo au lieu de celle cliquée.
- Module Pratique — fallback visuel si miniature échoue au chargement.
