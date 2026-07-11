-- validate_referral_code(text) still checked role = 'premium_gold', a role that
-- no longer exists since the subscription tiers were simplified to 'premium'/'admin'.
-- This silently broke every referral code (all real premium users have role='premium').
-- (The migration 20260415_simplify_subscription_tiers.sql intended this fix but was
-- never actually applied to production, so the old logic remained live.)
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code text)
RETURNS TABLE (
  valid boolean,
  referral_code text,
  referrer_name text,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral record;
BEGIN
  SELECT
    rc.referral_code,
    rc.is_active,
    p.role,
    p.full_name
  INTO v_referral
  FROM public.referral_codes rc
  JOIN public.profiles p ON p.id = rc.user_id
  WHERE rc.referral_code = UPPER(p_code)
  LIMIT 1;

  IF v_referral IS NULL THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, 'Invalid referral code';
    RETURN;
  END IF;

  IF v_referral.is_active IS NOT TRUE THEN
    RETURN QUERY SELECT false, v_referral.referral_code, NULL::text, 'This referral code is no longer active';
    RETURN;
  END IF;

  IF v_referral.role NOT IN ('premium', 'admin') THEN
    RETURN QUERY SELECT false, v_referral.referral_code, NULL::text, 'This referral code is no longer valid';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_referral.referral_code, COALESCE(v_referral.full_name, 'A Premium member'), NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;
