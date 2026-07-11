-- Correctif : le trigger de création des codes de parrainage pointait encore
-- sur l'ancien modèle (role = 'premium_gold' / create_referral_code_for_gold_user),
-- qui ne se déclenche plus jamais depuis le passage à l'offre unique 'premium'.
-- On le rebranche sur create_referral_code_for_premium (premium/admin).

-- 1. Durcir la fonction (search_path explicite) — conserve la logique existante
CREATE OR REPLACE FUNCTION public.create_referral_code_for_premium()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('premium', 'admin')
     AND (OLD.role IS NULL OR OLD.role NOT IN ('premium', 'admin')) THEN
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

-- Les fonctions trigger ne doivent pas être exposées comme RPC publiques
REVOKE EXECUTE ON FUNCTION public.create_referral_code_for_premium() FROM anon, authenticated, public;

-- 2. Supprimer l'ancien trigger "gold" (ne se déclenchait que pour premium_gold)
DROP TRIGGER IF EXISTS trigger_create_referral_code_on_gold_upgrade ON public.profiles;

-- 3. Créer le bon trigger
DROP TRIGGER IF EXISTS trigger_create_referral_code_on_premium ON public.profiles;
CREATE TRIGGER trigger_create_referral_code_on_premium
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
WHEN (NEW.role IN ('premium', 'admin'))
EXECUTE FUNCTION public.create_referral_code_for_premium();

-- 4. Supprimer l'ancienne fonction "gold" devenue inutile
DROP FUNCTION IF EXISTS public.create_referral_code_for_gold_user();

-- 5. Backfill : générer un code pour chaque premium/admin existant qui n'en a pas
INSERT INTO public.referral_codes (user_id, referral_code, is_active)
SELECT p.id,
       UPPER(SUBSTRING(MD5(p.id::text || clock_timestamp()::text || random()::text) FROM 1 FOR 8)),
       true
FROM public.profiles p
LEFT JOIN public.referral_codes rc ON rc.user_id = p.id
WHERE p.role IN ('premium','admin') AND rc.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
