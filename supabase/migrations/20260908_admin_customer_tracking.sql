-- Suivi client (CRM admin) : /admin/clients
--
-- Objectif : répondre depuis un seul écran aux questions « a-t-il pris
-- l'essai ? », « l'a-t-il annulé et pourquoi ? », « quelle offre a-t-il
-- prise ? », « que lui a-t-on déjà écrit ? ».
--
-- Rien de tout cela n'était conservé jusqu'ici : `profiles` ne porte que
-- l'état courant (offre, statut d'abonnement), pas l'histoire. Un compte
-- repassé en `free` après une résiliation est indiscernable d'un compte qui
-- n'a jamais rien pris, et le motif de résiliation collecté par le portail
-- Stripe partait dans une notification puis se perdait.
--
-- Quatre tables :
--   * `customer_events`  : la chronologie (inscription, essai, abonnement,
--                          changement d'offre, résiliation, impayé). C'est
--                          l'historique manquant.
--   * `customer_emails`  : les emails envoyés depuis la fiche client, avec
--                          leur suivi (délivré, ouvert, cliqué, rejeté).
--   * `customer_notes`   : les notes internes, jamais visibles du client.
--   * `customer_surveys` : les enquêtes « pourquoi ? » envoyées par lien
--                          personnel, et leurs réponses.
--
-- Toutes sont fermées au navigateur, à l'exception de la lecture admin :
-- l'écriture passe systématiquement par les routes /api/admin (service-role).

CREATE EXTENSION IF NOT EXISTS citext;

-- ── 1. Étiquettes libres sur les comptes ───────────────────────────────────
-- Segmenter à la main ce qu'aucun statut ne décrit : « à relancer »,
-- « école X », « ne pas contacter ». Un tableau plutôt qu'une table de
-- jointure : l'usage est du filtrage, jamais de la jointure.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_tags text[] NOT NULL DEFAULT '{}';

-- ── 2. Chronologie client ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_events (
  id bigserial PRIMARY KEY,

  -- `user_id` peut être NULL : un prospect (lead funnel, contact newsletter)
  -- n'a pas de compte. L'email reste alors la seule clé de rapprochement.
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email citext NOT NULL,

  event_type text NOT NULL CHECK (event_type IN (
    'signup',
    'trial_started',
    'trial_canceled',
    'trial_converted',
    'subscribed',
    'plan_changed',
    'renewed',
    'payment_failed',
    'canceled',
    'reactivated',
    'founding_granted',
    'survey_sent',
    'survey_answered',
    'admin_email',
    'note',
    'other'
  )),

  -- Offre concernée après l'événement, et offre précédente pour un
  -- changement d'offre. Sans ces deux colonnes, « plan_changed » n'apprend
  -- rien : c'est le couple qui porte l'information.
  plan text,
  previous_plan text,

  -- Motif de résiliation. `reason` reprend le code du portail Stripe
  -- (too_expensive, unused...), `comment` le texte libre du client. Les deux
  -- étaient jusqu'ici perdus après la notification à l'administrateur.
  reason text,
  comment text,

  -- Montant en centimes, quand l'événement en porte un (abonnement, échec de
  -- prélèvement). Permet de mesurer le revenu perdu à la résiliation.
  amount_cents integer,

  source text NOT NULL DEFAULT 'app'
    CHECK (source IN ('stripe', 'app', 'admin', 'backfill')),

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Date de l'événement réel, distincte de la date d'écriture : un
  -- rattrapage (backfill) ou un webhook rejoué ne doit pas se placer
  -- aujourd'hui dans la chronologie.
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_events_user
  ON public.customer_events (user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_events_email
  ON public.customer_events (email, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_events_type
  ON public.customer_events (event_type, occurred_at DESC);

-- ── 3. Emails envoyés depuis la fiche client ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email citext NOT NULL,

  subject text NOT NULL,
  html text NOT NULL,

  -- Nature de l'envoi, pour retrouver « tous ceux à qui j'ai demandé
  -- pourquoi ils sont partis » sans relire les sujets.
  category text NOT NULL DEFAULT 'relance'
    CHECK (category IN ('relance', 'enquete', 'onboarding', 'offre', 'support', 'autre')),

  -- Regroupe les destinataires d'un même envoi groupé.
  campaign_id uuid,

  provider text NOT NULL DEFAULT 'resend',
  provider_message_id text,

  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  error text,

  -- Suivi d'engagement, alimenté par le webhook Resend
  -- (app/api/emails/events). Les compteurs distinguent une ouverture unique
  -- d'une relecture, ce qu'un simple booléen ne dirait pas.
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,

  survey_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_emails_user
  ON public.customer_emails (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_emails_email
  ON public.customer_emails (email, sent_at DESC);
-- Le webhook Resend ne connaît que l'identifiant de message : c'est par lui
-- que se fait la mise à jour du statut, et elle doit rester indexée.
CREATE INDEX IF NOT EXISTS idx_customer_emails_provider_message
  ON public.customer_emails (provider_message_id)
  WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_emails_campaign
  ON public.customer_emails (campaign_id) WHERE campaign_id IS NOT NULL;

-- ── 4. Notes internes ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email citext NOT NULL,
  body text NOT NULL CHECK (length(btrim(body)) > 0),
  pinned boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_user
  ON public.customer_notes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_notes_email
  ON public.customer_notes (email, created_at DESC);

-- ── 5. Enquêtes « pourquoi ? » ─────────────────────────────────────────────
-- Une ligne par demande envoyée. Le `token` est le seul secret : il ouvre la
-- page publique /avis/<token>, qui ne demande aucune connexion. C'est
-- volontaire : exiger un compte pour répondre à « pourquoi êtes-vous
-- parti ? » écarterait précisément ceux qu'on interroge.
CREATE TABLE IF NOT EXISTS public.customer_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email citext NOT NULL,

  kind text NOT NULL CHECK (kind IN (
    'pourquoi_pas_abonne',   -- inscrit qui n'a jamais rien pris
    'pourquoi_essai_annule', -- essai annulé avant conversion
    'pourquoi_resiliation',  -- abonné parti
    'satisfaction',          -- abonné actif : ce qui plaît ou non
    'autre'
  )),

  token text NOT NULL UNIQUE,
  question text NOT NULL,

  -- Réponse. `rating` de 1 à 5 quand la question en appelle une,
  -- `choice` le motif coché, `answer` le texte libre.
  rating integer CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  choice text,
  answer text,

  sent_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_customer_surveys_user
  ON public.customer_surveys (user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_surveys_email
  ON public.customer_surveys (email, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_surveys_answered
  ON public.customer_surveys (responded_at DESC) WHERE responded_at IS NOT NULL;

ALTER TABLE public.customer_emails
  DROP CONSTRAINT IF EXISTS customer_emails_survey_id_fkey;
ALTER TABLE public.customer_emails
  ADD CONSTRAINT customer_emails_survey_id_fkey
  FOREIGN KEY (survey_id) REFERENCES public.customer_surveys(id) ON DELETE SET NULL;

-- ── 6. RLS ─────────────────────────────────────────────────────────────────
-- Écriture : service-role uniquement (routes /api/admin, webhooks).
-- Lecture : admin connecté, pour laisser la page interroger directement
-- Supabase si besoin. Un client ne voit jamais ces tables, y compris la ligne
-- qui le concerne : elles contiennent des notes internes.
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read customer events" ON public.customer_events;
CREATE POLICY "Admins read customer events"
  ON public.customer_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins read customer emails" ON public.customer_emails;
CREATE POLICY "Admins read customer emails"
  ON public.customer_emails FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins read customer notes" ON public.customer_notes;
CREATE POLICY "Admins read customer notes"
  ON public.customer_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins read customer surveys" ON public.customer_surveys;
CREATE POLICY "Admins read customer surveys"
  ON public.customer_surveys FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ── 7. Vue de synthèse ─────────────────────────────────────────────────────
-- Une ligne par compte, avec tout ce que la liste admin doit pouvoir trier :
-- étape du cycle de vie, essai, résiliation et son motif, engagement email,
-- dernière activité. Agréger ici plutôt que dans la route évite de rapatrier
-- quatre tables entières à chaque chargement de page.
--
-- La vue s'exécute avec les droits de son propriétaire : elle est donc
-- réservée à la clé service-role, et les droits `anon` / `authenticated`
-- sont explicitement retirés plus bas.
CREATE OR REPLACE VIEW public.admin_customer_overview AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.plan,
  p.subscription_status,
  p.subscription_start_date,
  p.subscription_end_date,
  p.commitment_end_date,
  p.trial_used_at,
  p.trial_ends_at,
  p.is_founding_member,
  p.is_complimentary,
  p.partner_discount_name,
  p.newsletter_opt_in,
  p.admin_tags,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.created_at,

  -- Étape du cycle de vie : ce que l'utilisateur cherche à filtrer. Elle se
  -- lit d'abord sur l'état courant, puis, pour un compte redevenu gratuit,
  -- sur l'histoire : sans ça, un client parti se confond avec un curieux
  -- jamais converti.
  CASE
    WHEN p.role = 'admin' THEN 'admin'
    WHEN p.subscription_status = 'trialing' THEN 'essai_en_cours'
    WHEN p.subscription_status = 'past_due' THEN 'impaye'
    WHEN p.plan <> 'free' THEN 'abonne'
    WHEN ev.canceled_at IS NOT NULL THEN 'resilie'
    WHEN p.trial_used_at IS NOT NULL THEN 'essai_termine'
    ELSE 'inscrit'
  END AS lifecycle_stage,

  (p.trial_used_at IS NOT NULL) AS has_trialed,
  ev.first_subscribed_at,
  ev.canceled_at,
  ev.churn_reason,
  ev.churn_comment,
  ev.last_event_at,
  COALESCE(ev.event_count, 0) AS event_count,

  em.emails_sent,
  em.emails_opened,
  em.emails_clicked,
  em.last_email_at,
  em.last_open_at,

  COALESCE(nt.notes_count, 0) AS notes_count,
  COALESCE(sv.surveys_sent, 0) AS surveys_sent,
  COALESCE(sv.surveys_answered, 0) AS surveys_answered,
  sv.last_answer_at,
  sv.last_rating,

  g.last_login_date,
  g.total_xp,
  g.current_streak,
  t.open_tickets
FROM public.profiles p

LEFT JOIN LATERAL (
  SELECT
    count(*) AS event_count,
    max(e.occurred_at) AS last_event_at,
    min(e.occurred_at) FILTER (WHERE e.event_type IN ('subscribed', 'trial_converted')) AS first_subscribed_at,
    max(e.occurred_at) FILTER (WHERE e.event_type IN ('canceled', 'trial_canceled')) AS canceled_at,
    (array_agg(e.reason ORDER BY e.occurred_at DESC)
       FILTER (WHERE e.event_type IN ('canceled', 'trial_canceled') AND e.reason IS NOT NULL))[1] AS churn_reason,
    (array_agg(e.comment ORDER BY e.occurred_at DESC)
       FILTER (WHERE e.event_type IN ('canceled', 'trial_canceled') AND e.comment IS NOT NULL))[1] AS churn_comment
  FROM public.customer_events e
  WHERE e.user_id = p.id OR e.email = p.email::citext
) ev ON true

LEFT JOIN LATERAL (
  SELECT
    count(*) AS emails_sent,
    count(*) FILTER (WHERE c.opened_at IS NOT NULL) AS emails_opened,
    count(*) FILTER (WHERE c.clicked_at IS NOT NULL) AS emails_clicked,
    max(c.sent_at) AS last_email_at,
    max(c.opened_at) AS last_open_at
  FROM public.customer_emails c
  WHERE c.user_id = p.id OR c.email = p.email::citext
) em ON true

LEFT JOIN LATERAL (
  SELECT count(*) AS notes_count
  FROM public.customer_notes n
  WHERE n.user_id = p.id OR n.email = p.email::citext
) nt ON true

LEFT JOIN LATERAL (
  SELECT
    count(*) AS surveys_sent,
    count(*) FILTER (WHERE s.responded_at IS NOT NULL) AS surveys_answered,
    max(s.responded_at) AS last_answer_at,
    (array_agg(s.rating ORDER BY s.responded_at DESC NULLS LAST)
       FILTER (WHERE s.rating IS NOT NULL))[1] AS last_rating
  FROM public.customer_surveys s
  WHERE s.user_id = p.id OR s.email = p.email::citext
) sv ON true

LEFT JOIN public.user_gamification_stats g ON g.user_id = p.id

LEFT JOIN LATERAL (
  SELECT count(*) AS open_tickets
  FROM public.support_tickets st
  WHERE st.user_email = p.email AND st.status <> 'resolved'
) t ON true;

REVOKE ALL ON public.admin_customer_overview FROM anon, authenticated;

-- ── 8. Rattrapage de l'historique existant ─────────────────────────────────
-- Sans cette reprise, la chronologie serait vide pour tous les comptes déjà
-- créés : le module ne servirait qu'aux inscrits à venir. On reconstruit ce
-- que `profiles` permet encore de savoir, marqué `source = 'backfill'` pour
-- ne jamais le confondre avec un événement réellement observé.
INSERT INTO public.customer_events (user_id, email, event_type, plan, source, occurred_at, metadata)
SELECT p.id, p.email::citext, 'signup', 'free', 'backfill', p.created_at,
       jsonb_build_object('rattrapage', true)
FROM public.profiles p
WHERE p.created_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.customer_events e
    WHERE e.user_id = p.id AND e.event_type = 'signup'
  );

INSERT INTO public.customer_events (user_id, email, event_type, plan, source, occurred_at, metadata)
SELECT p.id, p.email::citext, 'trial_started', p.plan, 'backfill', p.trial_used_at,
       jsonb_build_object('rattrapage', true)
FROM public.profiles p
WHERE p.trial_used_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.customer_events e
    WHERE e.user_id = p.id AND e.event_type = 'trial_started'
  );

INSERT INTO public.customer_events (user_id, email, event_type, plan, source, occurred_at, metadata)
SELECT p.id, p.email::citext, 'subscribed', p.plan, 'backfill', p.subscription_start_date,
       jsonb_build_object('rattrapage', true)
FROM public.profiles p
WHERE p.subscription_start_date IS NOT NULL
  AND p.plan <> 'free'
  AND NOT EXISTS (
    SELECT 1 FROM public.customer_events e
    WHERE e.user_id = p.id AND e.event_type = 'subscribed'
  );

-- Résiliations : `subscription_end_date` n'est renseignée qu'au départ, et le
-- compte est alors repassé en `free`. Le motif, lui, est irrécupérable : il
-- n'a jamais été stocké. Il le sera pour les prochaines.
INSERT INTO public.customer_events (user_id, email, event_type, previous_plan, plan, source, occurred_at, metadata)
SELECT p.id, p.email::citext, 'canceled', NULL, 'free', 'backfill', p.subscription_end_date,
       jsonb_build_object('rattrapage', true)
FROM public.profiles p
WHERE p.subscription_end_date IS NOT NULL
  AND p.plan = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM public.customer_events e
    WHERE e.user_id = p.id AND e.event_type = 'canceled'
  );

-- ── 9. Inscription : événement posé par la base ────────────────────────────
-- Un trigger plutôt qu'un appel applicatif : la création de profil passe déjà
-- par `handle_new_user`, par l'inscription classique et par la reprise d'un
-- compte OsteoFlow. Trois chemins, donc trois occasions d'oublier la ligne.
CREATE OR REPLACE FUNCTION public.log_signup_customer_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.customer_events (user_id, email, event_type, plan, source, occurred_at)
  VALUES (
    NEW.id,
    NEW.email::citext,
    'signup',
    COALESCE(NEW.plan, 'free'),
    'app',
    COALESCE(NEW.created_at, now())
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Le suivi client ne doit jamais empêcher une inscription d'aboutir.
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_signup_customer_event() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trigger_profiles_signup_event ON public.profiles;
CREATE TRIGGER trigger_profiles_signup_event
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_signup_customer_event();
