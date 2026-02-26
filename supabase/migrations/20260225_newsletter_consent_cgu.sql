-- Add newsletter opt-in and CGU acceptance fields to profiles table
-- RGPD compliance: track explicit consent for marketing emails and CGU acceptance

-- Newsletter opt-in: defaults to false (explicit opt-in required per RGPD)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false;

-- CGU/CGV acceptance timestamp: null means not accepted yet
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cgu_accepted_at timestamptz;

-- Update the handle_new_user trigger to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  RETURN NEW;
END;
$$;

-- Add updated_at column to mail_contacts if it doesn't exist
ALTER TABLE public.mail_contacts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Comment for documentation
COMMENT ON COLUMN public.profiles.newsletter_opt_in IS 'RGPD: explicit opt-in for marketing emails/newsletter. Default false.';
COMMENT ON COLUMN public.profiles.cgu_accepted_at IS 'Timestamp when user accepted CGU/CGV during registration. Null = not accepted.';
