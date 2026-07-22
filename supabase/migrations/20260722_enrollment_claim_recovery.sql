-- Récupération des claims orphelins du processeur d'automatisations.
-- Le processeur claim un lot (status='pending' → 'processing') puis le traite
-- séquentiellement ; si la fonction serverless meurt en plein lot (timeout),
-- les lignes non restaurées restent en 'processing' pour toujours car le claim
-- ne reprend que les 'pending'. 13 enrollments étaient bloqués ainsi en prod
-- (12 séquences d'onboarding de juillet + 1 de mars).

-- 1. Horodater le claim pour distinguer un verrou en cours (quelques secondes)
--    d'un verrou orphelin (crash) — last_run_at ne convient pas, il n'est mis à
--    jour qu'à l'envoi d'un step. Utilisé par la récupération automatique dans
--    lib/automation-processor.ts (seuil : 15 minutes).
ALTER TABLE public.mail_automation_enrollments
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

COMMENT ON COLUMN public.mail_automation_enrollments.claimed_at IS 'Horodatage du dernier claim par le processeur (status → processing). Un claim vieux de plus de 15 min est considéré orphelin (crash) et restitué à pending.';

-- 2. Débloquer les enrollments orphelins : les récents reprennent leur séquence
--    (le timing wait_minutes est préservé par last_run_at) ; ceux bloqués
--    depuis des mois sont annulés (une relance envoyée 4 mois en retard
--    n'a plus de sens).
UPDATE public.mail_automation_enrollments
SET status = 'cancelled'
WHERE status = 'processing' AND last_run_at < '2026-06-01';

UPDATE public.mail_automation_enrollments
SET status = 'pending'
WHERE status = 'processing';
