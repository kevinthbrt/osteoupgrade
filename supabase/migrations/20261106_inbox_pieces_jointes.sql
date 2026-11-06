-- Pièces jointes des réponses envoyées depuis la boîte mail admin.
--
-- Les fichiers ne transitent pas par les routes API (limite de taille des
-- requêtes sur Vercel) : le navigateur les dépose directement dans ce bucket
-- privé via un lien d'envoi signé, puis Resend les récupère par un lien de
-- lecture temporaire au moment de l'envoi. Aucune politique : seule la clé
-- service-role y accède, derrière `verifyAdmin`.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('inbox-attachments', 'inbox-attachments', false, 26214400)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.inbox_replies
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
