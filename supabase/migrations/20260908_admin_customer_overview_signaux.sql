-- Vue de synthèse : de quoi calculer les signaux d'action
--
-- Le module savait tout d'un client sans jamais dire par où commencer :
-- trente-six lignes triées par date d'inscription ne sont pas une liste de
-- travail. L'onglet « À traiter » comble ce manque, et il a besoin de trois
-- dates que la vue ne portait pas.
--
-- `last_contact_at` est la clé de voûte : un signal s'éteint dès qu'un contact
-- lui est postérieur, sans bouton « fait » à cliquer. Sans cette extinction
-- automatique, les voyants resteraient allumés, on cesserait de les regarder
-- en une semaine, et le module redeviendrait décoratif. Un voyant toujours
-- allumé n'est pas un voyant.
--
-- Il agrège les deux façons dont un contact existe : un email réellement parti
-- (`customer_emails`, échecs exclus, envois consignés compris) et un contact
-- consigné à la main sur un autre canal (appel, message, réponse reçue), qui ne
-- laisse qu'un événement. Ne regarder que les emails éteindrait un signal sur
-- un appel jamais passé, et le maintiendrait allumé après un appel passé.

DROP VIEW IF EXISTS public.admin_customer_overview;

CREATE VIEW public.admin_customer_overview AS
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

  CASE
    WHEN p.role = 'admin' THEN 'admin'
    WHEN p.subscription_status = 'trialing' THEN 'essai_en_cours'
    WHEN p.subscription_status = 'past_due' THEN 'impaye'
    WHEN p.plan <> 'free' THEN 'abonne'
    WHEN ev.canceled_at IS NOT NULL THEN 'resilie'
    WHEN ev.trial_canceled_at IS NOT NULL OR p.trial_used_at IS NOT NULL THEN 'essai_termine'
    ELSE 'inscrit'
  END AS lifecycle_stage,

  (p.trial_used_at IS NOT NULL) AS has_trialed,
  ev.first_subscribed_at,
  ev.canceled_at,
  ev.trial_canceled_at,
  ev.last_payment_failed_at,
  ev.churn_reason,
  ev.churn_comment,
  ev.last_event_at,
  COALESCE(ev.event_count, 0) AS event_count,

  em.emails_sent,
  em.emails_tracked,
  em.emails_failed,
  em.emails_opened,
  em.emails_clicked,
  em.last_email_at,
  em.last_open_at,

  -- Dernier contact, tous canaux confondus. `GREATEST` ignore les NULL en
  -- Postgres : un client jamais contacté par email mais appelé la semaine
  -- dernière porte bien la date de l'appel.
  GREATEST(em.last_email_at, ev.last_manual_contact_at) AS last_contact_at,

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
    max(e.occurred_at) FILTER (WHERE e.event_type = 'canceled') AS canceled_at,
    max(e.occurred_at) FILTER (WHERE e.event_type = 'trial_canceled') AS trial_canceled_at,
    max(e.occurred_at) FILTER (WHERE e.event_type = 'payment_failed') AS last_payment_failed_at,
    -- Contacts consignés sur un canal autre que l'email : eux seuls portent
    -- `metadata.canal`, un envoi Resend n'en a pas.
    max(e.occurred_at) FILTER (
      WHERE e.event_type = 'other' AND e.metadata ? 'canal'
    ) AS last_manual_contact_at,
    (array_agg(e.reason ORDER BY e.occurred_at DESC)
       FILTER (WHERE e.event_type IN ('canceled', 'trial_canceled') AND e.reason IS NOT NULL))[1] AS churn_reason,
    (array_agg(e.comment ORDER BY e.occurred_at DESC)
       FILTER (WHERE e.event_type IN ('canceled', 'trial_canceled') AND e.comment IS NOT NULL))[1] AS churn_comment
  FROM public.customer_events e
  WHERE e.user_id = p.id OR e.email = p.email::citext
) ev ON true

LEFT JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE c.status <> 'failed') AS emails_sent,
    count(*) FILTER (WHERE c.status <> 'failed' AND c.provider IS DISTINCT FROM 'manuel') AS emails_tracked,
    count(*) FILTER (WHERE c.status = 'failed') AS emails_failed,
    count(*) FILTER (WHERE c.opened_at IS NOT NULL) AS emails_opened,
    count(*) FILTER (WHERE c.clicked_at IS NOT NULL) AS emails_clicked,
    max(c.sent_at) FILTER (WHERE c.status <> 'failed') AS last_email_at,
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
