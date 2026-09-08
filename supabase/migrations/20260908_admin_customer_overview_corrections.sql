-- Vue de synthèse : deux corrections signalées à la revue de la PR 337
--
-- 1. Un essai annulé n'est pas une résiliation
--
--    `canceled_at` agrégeait `canceled` ET `trial_canceled`. Un compte ayant
--    abandonné son essai gratuit sans jamais payer était donc classé
--    « résilié », et l'admin lui proposait par défaut l'enquête « pourquoi
--    avez-vous résilié votre abonnement ? » : une question sur un abonnement
--    qu'il n'a jamais eu. C'est précisément l'erreur que le routage des
--    enquêtes par étape devait empêcher, et elle rendait `essai_termine`
--    inatteignable, donc l'enquête « pourquoi l'essai a été annulé » morte.
--
--    Les deux dates sont désormais distinctes. `churn_reason` continue de
--    regarder les deux : le motif d'un essai abandonné est aussi utile que
--    celui d'un départ payant.
--
-- 2. Un envoi refusé par Resend n'est pas une relance
--
--    `emails_sent` comptait aussi les lignes `status = 'failed'`, écrites
--    exprès pour garder trace d'un refus. Conséquence exactement inverse de
--    l'intention : la personne sortait de « jamais relancé », donc on ne la
--    relançait plus, et entrait dans « sans réaction », comme si elle avait
--    ignoré un message qu'elle n'a jamais reçu.
--
--    `emails_failed` est exposé à part, pour que l'échec reste visible sans
--    être compté comme un envoi.

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
    -- Seule une résiliation payante fait un résilié.
    WHEN ev.canceled_at IS NOT NULL THEN 'resilie'
    WHEN ev.trial_canceled_at IS NOT NULL OR p.trial_used_at IS NOT NULL THEN 'essai_termine'
    ELSE 'inscrit'
  END AS lifecycle_stage,

  (p.trial_used_at IS NOT NULL) AS has_trialed,
  ev.first_subscribed_at,
  ev.canceled_at,
  ev.trial_canceled_at,
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
    -- Envois réellement mesurables : ni consignés à la main, ni refusés.
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
