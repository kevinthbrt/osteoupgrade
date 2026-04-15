-- Migration: Simplifier les tiers d'abonnement
-- Suppression de premium_silver et premium_gold → un seul rôle 'premium'
-- Les séminaires sont également supprimés

-- 1. Migrer tous les utilisateurs premium_silver et premium_gold vers premium
UPDATE profiles
SET role = 'premium'
WHERE role IN ('premium_silver', 'premium_gold');

-- 2. Mettre à jour les politiques RLS qui vérifient les anciens rôles
-- (les politiques existantes sont remplacées par des nouvelles ci-dessous)

-- 3. Mettre à jour les codes de parrainage : le trigger vérifiait premium_gold
-- On met à jour la fonction pour accepter 'premium'
CREATE OR REPLACE FUNCTION create_referral_code_for_premium()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer un code de parrainage uniquement pour les membres premium (ou admin)
  IF NEW.role IN ('premium', 'admin') AND (OLD.role IS NULL OR OLD.role NOT IN ('premium', 'admin')) THEN
    INSERT INTO referral_codes (user_id, referral_code, is_active)
    VALUES (
      NEW.id,
      UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8)),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Mettre à jour la fonction de validation des codes de parrainage
CREATE OR REPLACE FUNCTION validate_referral_code(p_referral_code TEXT, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_referral_code referral_codes%ROWTYPE;
  v_referrer_profile profiles%ROWTYPE;
BEGIN
  -- Récupérer le code de parrainage
  SELECT * INTO v_referral_code
  FROM referral_codes
  WHERE referral_code = UPPER(p_referral_code)
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code de parrainage invalide ou inactif');
  END IF;

  -- Vérifier que ce n'est pas son propre code
  IF v_referral_code.user_id = p_user_id THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Vous ne pouvez pas utiliser votre propre code');
  END IF;

  -- Récupérer le profil du parrain
  SELECT * INTO v_referrer_profile
  FROM profiles
  WHERE id = v_referral_code.user_id;

  -- Vérifier que le parrain est premium
  IF v_referrer_profile.role NOT IN ('premium', 'admin') THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Le parrain n\'est plus un membre Premium actif');
  END IF;

  -- Vérifier que l'utilisateur n'a pas déjà été parrainé
  IF EXISTS (
    SELECT 1 FROM referral_transactions
    WHERE referred_user_id = p_user_id
    LIMIT 1
  ) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Vous avez déjà été parrainé');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'referrer_id', v_referral_code.user_id,
    'referral_code', v_referral_code.referral_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Supprimer les tables liées aux séminaires (plus utilisées)
DROP TABLE IF EXISTS seminar_registrations CASCADE;
DROP TABLE IF EXISTS seminars CASCADE;
