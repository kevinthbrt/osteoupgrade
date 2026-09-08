-- Vue de synthèse : distinguer les emails réellement suivis de ceux consignés
--
-- Un email inscrit à la main dans la chronologie (relance partie de la boîte
-- de l'administrateur avant la mise en service du module) n'a et n'aura
-- jamais de statut d'ouverture : rien ne peut être mesuré d'un message envoyé
-- ailleurs. Compté comme les autres, il faisait apparaître le compte dans la
-- liste « sans réaction », qui affirme alors « relancé, aucun signe de vie »
-- là où la vérité est « nous n'en savons rien ».
--
-- `emails_tracked` ne compte que les envois passés par Resend, ceux dont
-- l'absence d'ouverture veut dire quelque chose.
--
-- La vue est recréée en entier plutôt que remplacée : `CREATE OR REPLACE VIEW`
-- n'autorise l'ajout de colonnes qu'en fin de liste, et `emails_tracked` a sa
-- place à côté de `emails_sent`.

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
  em.emails_tracked,
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
    -- Seuls les envois passés par Resend portent un suivi exploitable.
    count(*) FILTER (WHERE c.provider IS DISTINCT FROM 'manuel') AS emails_tracked,
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
