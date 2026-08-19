-- Phase 4 (partie lancement) du passage à 3 offres — cf. docs/PRICING_3_OFFRES.md.
--
-- Le parrainage était adossé au rôle : seuls `premium` et `admin` obtenaient un
-- code, et seuls eux étaient reconnus comme parrains valides. Or l'offre
-- MyOsteoFlow seul a pour rôle miroir `trial`. Sans cette migration, le premier
-- abonné MyOsteoFlow n'aurait jamais reçu de code — et si on lui en avait donné
-- un, il aurait été refusé à la validation.
--
-- Tout bascule donc sur `profiles.plan` : toute offre payante ouvre droit au
-- parrainage. Les membres fondateurs en restent exclus (déjà -50 % à vie,
-- cf. 20260708_disable_referral_for_founding_members.sql).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Création du code : toute offre payante, plus seulement `premium`
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_referral_code_for_premium()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_a_droit      boolean;
  v_avait_droit  boolean;
BEGIN
  -- Un admin n'a pas d'offre : on le traite à part pour ne pas le priver de code.
  v_a_droit := (NEW.plan <> 'free') OR (NEW.role = 'admin');

  -- Sur INSERT il n'y a pas d'état précédent : OLD n'est pas assigné.
  IF TG_OP = 'INSERT' THEN
    v_avait_droit := false;
  ELSE
    v_avait_droit := (COALESCE(OLD.plan, 'free') <> 'free') OR (COALESCE(OLD.role, '') = 'admin');
  END IF;

  IF v_a_droit AND NOT v_avait_droit AND NOT COALESCE(NEW.is_founding_member, false) THEN
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

-- La condition WHEN filtrait sur le rôle : elle aurait empêché la fonction
-- d'être appelée pour un abonné MyOsteoFlow (rôle miroir `trial`).
DROP TRIGGER IF EXISTS trigger_create_referral_code_on_premium ON public.profiles;
CREATE TRIGGER trigger_create_referral_code_on_premium
AFTER INSERT OR UPDATE OF role, plan ON public.profiles
FOR EACH ROW
WHEN (NEW.plan <> 'free' OR NEW.role = 'admin')
EXECUTE FUNCTION public.create_referral_code_for_premium();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Validation d'un code : le parrain doit avoir une offre payante
-- ─────────────────────────────────────────────────────────────────────────

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
  SELECT rc.referral_code, rc.is_active, p.plan, p.role, p.full_name
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

  IF v_referral.plan = 'free' AND v_referral.role <> 'admin' THEN
    RETURN QUERY SELECT false, v_referral.referral_code, NULL::text, 'This referral code is no longer valid';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_referral.referral_code, COALESCE(v_referral.full_name, 'Un membre abonné'), NULL::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.validate_referral_code(p_referral_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code     referral_codes%ROWTYPE;
  v_referrer profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_code FROM referral_codes WHERE referral_code = UPPER(p_referral_code) AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'error', 'Code invalide ou inactif'); END IF;

  IF v_code.user_id = p_user_id THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Vous ne pouvez pas utiliser votre propre code');
  END IF;

  SELECT * INTO v_referrer FROM profiles WHERE id = v_code.user_id;

  IF v_referrer.plan = 'free' AND v_referrer.role <> 'admin' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Le parrain n''a plus d''abonnement actif');
  END IF;

  IF EXISTS (SELECT 1 FROM referral_transactions WHERE referred_user_id = p_user_id LIMIT 1) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Déjà parrainé');
  END IF;

  RETURN jsonb_build_object('valid', true, 'referrer_id', v_code.user_id, 'referral_code', v_code.referral_code);
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Rattrapage : codes manquants pour les abonnés existants
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO public.referral_codes (user_id, referral_code, is_active)
SELECT p.id, UPPER(SUBSTRING(MD5(p.id::text || NOW()::text) FROM 1 FOR 8)), true
FROM public.profiles p
LEFT JOIN public.referral_codes rc ON rc.user_id = p.id
WHERE rc.user_id IS NULL
  AND (p.plan <> 'free' OR p.role = 'admin')
  AND NOT COALESCE(p.is_founding_member, false)
ON CONFLICT (user_id) DO NOTHING;
