-- Essai gratuit de 7 jours pour les comptes free (carte requise, conversion
-- automatique en abonnement payant si non annulé avant la fin de l'essai).
--
-- trial_used_at   : horodatage du démarrage du premier (et unique) essai gratuit
--                    de l'utilisateur. Sert à empêcher de relancer un essai en
--                    annulant puis en se réabonnant.
-- trial_ends_at    : date de fin de l'essai en cours (issue de Stripe
--                    `subscription.trial_end`), utilisée pour l'affichage côté UI.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
