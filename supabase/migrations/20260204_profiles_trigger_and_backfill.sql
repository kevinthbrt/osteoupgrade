-- Ensure profiles are created for every auth user and backfill missing rows.

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

  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (NEW.id, NEW.email, resolved_full_name, 'free', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT
  u.id,
  u.email,
  NULLIF(BTRIM(u.raw_user_meta_data->>'full_name'), ''),
  'free',
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
