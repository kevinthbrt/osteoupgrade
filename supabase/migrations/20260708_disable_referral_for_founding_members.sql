-- Disable the referral program for Founding Members.
-- Founding Members pay a fixed -50% lifetime annual price (299,94€/an) and the
-- flat 49,99€ referral credit doesn't map cleanly onto that billing, so referral
-- codes are deactivated while is_founding_member = true, and reactivated if the
-- flag is later removed (as long as the account is still premium/admin).

-- 1. Deactivate any existing referral codes for current Founding Members
UPDATE public.referral_codes rc
SET is_active = false
FROM public.profiles p
WHERE p.id = rc.user_id
  AND p.is_founding_member = true
  AND rc.is_active = true;

-- 2. Update the role-based auto-creation trigger to skip Founding Members
CREATE OR REPLACE FUNCTION public.create_referral_code_for_premium()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('premium', 'admin')
     AND (OLD.role IS NULL OR OLD.role NOT IN ('premium', 'admin'))
     AND NOT COALESCE(NEW.is_founding_member, false) THEN
    INSERT INTO public.referral_codes (user_id, referral_code, is_active)
    VALUES (
      NEW.id,
      UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8)),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_referral_code_for_premium() FROM anon, authenticated, public;

-- 3. New trigger reacting to is_founding_member toggles (the role trigger above
-- only fires on role changes, so a separate trigger is needed to react when an
-- already-premium account is flagged/unflagged as Founding Member)
CREATE OR REPLACE FUNCTION public.sync_referral_code_founding_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_founding_member IS TRUE AND COALESCE(OLD.is_founding_member, false) IS NOT TRUE THEN
    UPDATE public.referral_codes
    SET is_active = false
    WHERE user_id = NEW.id;
  ELSIF COALESCE(NEW.is_founding_member, false) IS NOT TRUE AND OLD.is_founding_member IS TRUE THEN
    IF NEW.role IN ('premium', 'admin') THEN
      UPDATE public.referral_codes
      SET is_active = true
      WHERE user_id = NEW.id;

      INSERT INTO public.referral_codes (user_id, referral_code, is_active)
      VALUES (
        NEW.id,
        UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8)),
        true
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_referral_code_founding_member() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS trigger_sync_referral_code_founding_member ON public.profiles;
CREATE TRIGGER trigger_sync_referral_code_founding_member
AFTER UPDATE OF is_founding_member ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_referral_code_founding_member();
