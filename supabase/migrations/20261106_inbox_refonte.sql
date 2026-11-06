-- Refonte de la boîte mail admin (/admin/emails).
--
-- Jusqu'ici, `received_emails` ne savait dire que « lu » ou « non lu ». Un
-- message ouvert ressemblait à un message réglé, une réponse partait par la
-- route des newsletters sans laisser de trace, et le classement tenait en
-- quatre mots-clés dans l'objet.
--
-- Cette migration ajoute :
--   * un statut de traitement (à traiter, en attente du client, traité) ;
--   * des conversations : `thread_id` regroupe les messages d'un même
--     échange, `is_latest` désigne le dernier, le seul affiché dans la liste ;
--   * le rattachement au compte de l'expéditeur (`profile_id`) ;
--   * l'origine du classement (`category_source`), pour qu'un reclassement
--     automatique ne touche jamais une catégorie choisie à la main ;
--   * les réponses envoyées (`inbox_replies`), les modèles de réponse
--     (`inbox_templates`), les règles de classement (`inbox_rules`) et les
--     réglages (`inbox_settings` : signature, expéditeur, IA).
--
-- Comme les autres tables admin, aucune politique RLS : tout passe par la clé
-- service-role, derrière `verifyAdmin`.

BEGIN;

-- ── received_emails ────────────────────────────────────────────────────────

ALTER TABLE public.received_emails
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo',
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS thread_id uuid,
  ADD COLUMN IF NOT EXISTS is_latest boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_source text NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS category_reason text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS in_reply_to text,
  ADD COLUMN IF NOT EXISTS references_ids text[] NOT NULL DEFAULT '{}';

-- Valeurs historiques : parrainage, support, general, spam (toutes conservées).
UPDATE public.received_emails SET category = 'general' WHERE category IS NULL;

ALTER TABLE public.received_emails
  ALTER COLUMN category SET DEFAULT 'general',
  ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.received_emails DROP CONSTRAINT IF EXISTS received_emails_category_check;
ALTER TABLE public.received_emails ADD CONSTRAINT received_emails_category_check
  CHECK (category IN ('support', 'facturation', 'parrainage', 'prospection', 'notification', 'general', 'spam'));

ALTER TABLE public.received_emails DROP CONSTRAINT IF EXISTS received_emails_status_check;
ALTER TABLE public.received_emails ADD CONSTRAINT received_emails_status_check
  CHECK (status IN ('todo', 'waiting', 'done'));

ALTER TABLE public.received_emails DROP CONSTRAINT IF EXISTS received_emails_category_source_check;
ALTER TABLE public.received_emails ADD CONSTRAINT received_emails_category_source_check
  CHECK (category_source IN ('auto', 'rule', 'ai', 'manual'));

-- Chaque message existant devient sa propre conversation.
UPDATE public.received_emails SET thread_id = id WHERE thread_id IS NULL;
ALTER TABLE public.received_emails
  ALTER COLUMN thread_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN thread_id SET NOT NULL;

-- Rattachement aux comptes existants.
UPDATE public.received_emails r
SET profile_id = p.id
FROM public.profiles p
WHERE r.profile_id IS NULL
  AND lower(p.email) = lower(r.from_email);

-- Le spam déjà en base a été trié à la main : on ne le reclassera pas.
UPDATE public.received_emails
SET category_source = 'manual'
WHERE category = 'spam';

-- Notifications internes (« Nouvel abonnement », envoyées par
-- no-reply@osteo-upgrade.fr) et expéditeurs automatiques : rien à répondre.
-- Les signalements de bug, eux, restent en support (déjà classés ainsi).
UPDATE public.received_emails
SET category = 'notification',
    category_reason = 'Expéditeur automatique'
WHERE category = 'general'
  AND (
    lower(from_email) LIKE '%@osteo-upgrade.fr'
    OR lower(split_part(from_email, '@', 1)) ~ '(^|[-_.])(no-?reply|noreply|notifications?|mailer-daemon|postmaster)([-_.]|$)'
  );

-- Les signalements internes ne sont pas des messages de client à ignorer :
-- ils restent à traiter, mais les anciens sont considérés comme vus.
UPDATE public.received_emails
SET category_reason = 'Formulaire interne'
WHERE lower(from_email) LIKE '%@osteo-upgrade.fr'
  AND category = 'support';

-- Statut de départ : seul le récent et l'utile reste « à traiter ».
UPDATE public.received_emails
SET status = CASE
      WHEN is_archived THEN 'done'
      WHEN category IN ('spam', 'notification', 'prospection') THEN 'done'
      WHEN received_at < now() - interval '14 days' THEN 'done'
      ELSE 'todo'
    END,
    status_changed_at = now();

CREATE INDEX IF NOT EXISTS received_emails_inbox_idx
  ON public.received_emails (is_latest, is_archived, status, received_at DESC);
CREATE INDEX IF NOT EXISTS received_emails_thread_idx
  ON public.received_emails (thread_id, received_at);
CREATE INDEX IF NOT EXISTS received_emails_from_lower_idx
  ON public.received_emails (lower(from_email));
CREATE INDEX IF NOT EXISTS received_emails_message_id_idx
  ON public.received_emails (resend_message_id);

-- ── Modèles de réponse ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inbox_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  subject text,
  body text NOT NULL,
  layout text NOT NULL DEFAULT 'simple' CHECK (layout IN ('simple', 'brand')),
  emoji text,
  banner_title text,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inbox_templates ENABLE ROW LEVEL SECURITY;

-- ── Réponses envoyées ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inbox_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid REFERENCES public.received_emails(id) ON DELETE SET NULL,
  thread_id uuid NOT NULL,
  to_email text NOT NULL,
  from_email text,
  subject text NOT NULL,
  body_text text NOT NULL,
  html text NOT NULL,
  layout text NOT NULL DEFAULT 'simple',
  template_id uuid REFERENCES public.inbox_templates(id) ON DELETE SET NULL,
  provider_message_id text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error text,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inbox_replies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS inbox_replies_thread_idx ON public.inbox_replies (thread_id, created_at);

-- ── Règles de classement ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inbox_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field text NOT NULL CHECK (field IN ('from', 'domain', 'subject', 'body')),
  pattern text NOT NULL,
  category text NOT NULL CHECK (category IN ('support', 'facturation', 'parrainage', 'prospection', 'notification', 'general', 'spam')),
  mark_done boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  hit_count integer NOT NULL DEFAULT 0,
  last_hit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inbox_rules ENABLE ROW LEVEL SECURITY;

-- ── Réglages (une seule ligne) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.inbox_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  from_name text NOT NULL DEFAULT 'OsteoUpgrade',
  signature text NOT NULL DEFAULT E'Belle journée,\nL’équipe OsteoUpgrade × MyOsteoflow',
  default_layout text NOT NULL DEFAULT 'simple' CHECK (default_layout IN ('simple', 'brand')),
  quote_original boolean NOT NULL DEFAULT true,
  ai_enabled boolean NOT NULL DEFAULT true,
  notify_categories text[] NOT NULL DEFAULT '{support,facturation,parrainage}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inbox_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.inbox_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── Données de départ ──────────────────────────────────────────────────────

-- Règles tirées du courrier réellement reçu.
INSERT INTO public.inbox_rules (field, pattern, category, mark_done, priority)
SELECT * FROM (VALUES
  ('subject', '[osteoupgrade] nouvel abonnement', 'notification', true, 10),
  ('domain', 'qberos.org', 'spam', true, 20)
) AS v(field, pattern, category, mark_done, priority)
WHERE NOT EXISTS (SELECT 1 FROM public.inbox_rules);

-- Modèles : le corps commence par la formule d'appel, la signature est
-- ajoutée automatiquement à l'envoi.
INSERT INTO public.inbox_templates (name, category, subject, body, layout, sort_order)
SELECT * FROM (VALUES
  (
    'Accusé de réception', NULL, NULL,
    E'Bonjour {{prenom}},\n\nMerci pour votre message, nous l’avons bien reçu.\n\nNous revenons vers vous très rapidement avec une réponse complète.',
    'simple', 10
  ),
  (
    'Support : besoin de précisions', 'support', NULL,
    E'Bonjour {{prenom}},\n\nMerci de nous avoir signalé ce souci, et désolés pour la gêne occasionnée.\n\nPour que nous puissions vous aider au plus vite, pourriez-vous nous préciser :\n\n• la page ou la fonctionnalité concernée ;\n• l’appareil et le navigateur utilisés (ordinateur, téléphone, Chrome, Safari…) ;\n• si possible, une capture d’écran du message affiché.\n\nNous regardons dès réception.',
    'simple', 20
  ),
  (
    'Support : problème résolu', 'support', NULL,
    E'Bonjour {{prenom}},\n\nBonne nouvelle : le problème que vous nous avez signalé est corrigé.\n\nN’hésitez pas à recharger la page (ou à vous reconnecter) et à nous dire si tout fonctionne de votre côté.\n\nMerci encore pour votre retour, il nous aide à améliorer la plateforme.',
    'simple', 30
  ),
  (
    'Facturation : factures et abonnement', 'facturation', NULL,
    E'Bonjour {{prenom}},\n\nVous retrouvez toutes vos factures, votre moyen de paiement et la gestion de votre abonnement depuis votre espace, rubrique « Paramètres » puis « Abonnement » :\nhttps://www.osteo-upgrade.fr/settings/subscription\n\nSi quelque chose ne correspond pas à ce que vous attendiez, répondez simplement à ce message et nous regardons ensemble.',
    'simple', 40
  ),
  (
    'Parrainage : comment ça marche', 'parrainage', NULL,
    E'Bonjour {{prenom}},\n\nMerci pour votre intérêt pour le programme de parrainage !\n\nVotre lien personnel, le suivi de vos filleuls et vos commissions sont disponibles depuis votre espace :\nhttps://www.osteo-upgrade.fr/settings/referrals\n\nSi vous avez une question sur une commission en particulier, indiquez-nous l’adresse email du filleul concerné et nous vérifions.',
    'simple', 50
  ),
  (
    'Prospection : refus poli', 'prospection', NULL,
    E'Bonjour,\n\nMerci pour votre proposition. Elle ne correspond pas à nos besoins actuels, nous ne donnerons donc pas suite.\n\nBonne continuation.',
    'simple', 60
  ),
  (
    'Bienvenue (gabarit illustré)', NULL, NULL,
    E'Bonjour {{prenom}},\n\nMerci pour votre message et bienvenue chez OsteoUpgrade !\n\nNous sommes ravis de vous compter parmi nous. N’hésitez pas à nous écrire à chaque fois que vous avez une question : nous lisons tous les messages.',
    'brand', 70
  )
) AS v(name, category, subject, body, layout, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.inbox_templates);

COMMIT;
