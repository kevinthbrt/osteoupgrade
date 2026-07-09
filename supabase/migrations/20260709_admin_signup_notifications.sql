-- Admin dashboard & signup notifications
--
-- Adds a 'signup' notification type and makes the new-user trigger create an
-- admin notification for every new account (all signup paths: email/password,
-- OAuth, etc.), so new registrations surface in the admin notification bell in
-- real time — just like new subscriptions and bug reports already do.

-- 1. Allow the new 'signup' notification type
ALTER TABLE public.admin_notifications
  DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

ALTER TABLE public.admin_notifications
  ADD CONSTRAINT admin_notifications_type_check
  CHECK (type = ANY (ARRAY['bug_report'::text, 'new_subscription'::text, 'referral'::text, 'signup'::text, 'other'::text]));

-- 2. Extend the new-user handler to emit a signup notification.
--    Runs as SECURITY DEFINER, so the insert bypasses RLS.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  resolved_full_name text;
BEGIN
  resolved_full_name := NULLIF(BTRIM(NEW.raw_user_meta_data->>'full_name'), '');

  INSERT INTO public.profiles (id, email, full_name, role, newsletter_opt_in, created_at, updated_at)
  VALUES (NEW.id, NEW.email, resolved_full_name, 'free', false, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();

  -- 🔔 Admin notification (bell) for the new signup
  INSERT INTO public.admin_notifications (type, title, body, metadata)
  VALUES (
    'signup',
    'Nouvelle inscription',
    COALESCE(resolved_full_name || ' · ', '') || NEW.email,
    jsonb_build_object('user_id', NEW.id, 'email', NEW.email, 'full_name', resolved_full_name)
  );

  RETURN NEW;
END;
$function$;

-- 3. Indexes to keep the stats dashboard and notification bell snappy as the
--    tables grow.
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
  ON public.profiles (created_at);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
  ON public.admin_notifications (created_at DESC);
