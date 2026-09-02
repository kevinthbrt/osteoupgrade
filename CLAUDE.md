# OsteoUpgrade

Plateforme de formation et de gestion pour ostéopathes : Next.js 14 (App Router),
Supabase, Stripe, Resend, déployée sur Vercel.

## Règles de rédaction

Elles s'appliquent à **tout** contenu produit : copie des pages, emails,
documentation, changelog, commentaires de code, messages de commit.

- **Pas de tiret cadratin ni demi-cadratin** (`—`, `–`). Utiliser deux-points,
  une virgule, une parenthèse ou une phrase séparée. C'est une règle absolue,
  y compris quand l'incise semble naturelle.
- **Emails signés « L'équipe OsteoUpgrade × MyOsteoflow »**, jamais d'un prénom.
- **Français**, avec les apostrophes typographiques (`'`) et les guillemets
  français (« »).

## Emails

Tous les emails partagent un gabarit unique, à reprendre pour tout nouveau
message (référence : le gabarit `Onboarding gratuit - J+1` en base) :

- bandeau dégradé violet `#8b5cf6` → `#7c3aed`, emoji, titre blanc, sous-titre ;
- corps blanc, `padding: 40px`, texte `#374151`, police Inter ;
- encarts lavande `#f5f3ff`, `border-radius: 8px` ;
- bouton d'action en dégradé violet ;
- pied de page gris `#f9fafb` avec la mention de copyright.

Le pied de désinscription et les en-têtes `List-Unsubscribe` sont ajoutés
automatiquement à l'envoi (`lib/mailing.ts`). Ne pas les écrire dans le gabarit.

Les séquences sont stockées en base (`mail_automations`, `mail_automation_steps`,
`mail_templates`) et créées par migration. `wait_minutes` est un délai depuis
l'étape précédente, pas depuis l'inscription.

## Base de données

Les migrations vivent dans `supabase/migrations/`. Vérifier la syntaxe avant
d'appliquer, et privilégier un essai dans une transaction annulée sur la base
réelle plutôt qu'une application directe.

`supabaseAdmin` (clé service-role) force `cache: 'no-store'` : le Data Cache de
Next met sinon en cache les lectures Supabase entre déploiements, ce qui a déjà
produit un contrôle de rôle périmé en production.

## Funnels

Voir `docs/FUNNELS.md`. Points à ne pas oublier :

- l'opt-in crée un contact de diffusion et un lead, **pas un compte** ;
- les tables funnel n'ont aucune politique `anon`, le rendu public passe par la
  clé service-role qui filtre sur `status = 'published'` ;
- les tarifs Fondateur sont réservés aux comptes `is_founding_member` : ne
  jamais les pousser depuis un funnel destiné à des prospects.
