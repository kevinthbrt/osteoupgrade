-- Migration: Simplifier les tiers d'abonnement
-- Suppression de premium_silver et premium_gold → un seul rôle 'premium'
-- Les séminaires sont également supprimés

-- 1. Migrer tous les utilisateurs premium_silver et premium_gold vers premium
UPDATE profiles
SET role = 'premium'
WHERE role IN ('premium_silver', 'premium_gold');

-- 2. Mettre à jour les politiques RLS qui vérifient les anciens rôles

-- elearning_formations
DROP POLICY IF EXISTS "Allow users to view formations" ON elearning_formations;
CREATE POLICY "Allow users to view formations"
ON elearning_formations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR
    (
      NOT is_private AND
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium', 'admin')
    )
    OR
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- orthopedic_tests
DROP POLICY IF EXISTS "Allow authenticated users to view tests" ON orthopedic_tests;
CREATE POLICY "Allow authenticated users to view tests"
ON orthopedic_tests FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium', 'admin')
    OR
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- pathologies
DROP POLICY IF EXISTS "Allow authenticated users to view pathologies" ON pathologies;
CREATE POLICY "Allow authenticated users to view pathologies"
ON pathologies FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium', 'admin')
    OR
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- elearning_topographic_views
DROP POLICY IF EXISTS "Allow authenticated users to view topographic views" ON elearning_topographic_views;
CREATE POLICY "Allow authenticated users to view topographic views"
ON elearning_topographic_views FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium', 'admin')
    OR
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- practice_videos
DROP POLICY IF EXISTS "Allow authenticated users to view practice videos" ON practice_videos;
CREATE POLICY "Allow authenticated users to view practice videos"
ON practice_videos FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium', 'admin')
    OR
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- elearning_quizzes
DROP POLICY IF EXISTS "Authenticated users can view active quizzes they have access to" ON public.elearning_quizzes;
CREATE POLICY "Authenticated users can view active quizzes they have access to"
  ON public.elearning_quizzes FOR SELECT
  USING (
    is_active = true
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('premium', 'admin')
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.elearning_subparts  es
        JOIN public.elearning_chapters  ec ON ec.id = es.chapter_id
        JOIN public.elearning_formations ef ON ef.id = ec.formation_id
        WHERE es.id = elearning_quizzes.subpart_id
        AND ef.is_free_access = true
      )
    )
  );

-- elearning_quiz_questions
DROP POLICY IF EXISTS "Authenticated users can view questions they have access to" ON public.elearning_quiz_questions;
CREATE POLICY "Authenticated users can view questions they have access to"
  ON public.elearning_quiz_questions FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('premium', 'admin')
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.elearning_quizzes    eq
        JOIN public.elearning_subparts   es ON es.id = eq.subpart_id
        JOIN public.elearning_chapters   ec ON ec.id = es.chapter_id
        JOIN public.elearning_formations ef ON ef.id = ec.formation_id
        WHERE eq.id = elearning_quiz_questions.quiz_id
        AND ef.is_free_access = true
      )
    )
  );

-- elearning_quiz_answers
DROP POLICY IF EXISTS "Authenticated users can view answers they have access to" ON public.elearning_quiz_answers;
CREATE POLICY "Authenticated users can view answers they have access to"
  ON public.elearning_quiz_answers FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('premium', 'admin')
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.elearning_quiz_questions eq_q
        JOIN public.elearning_quizzes        eq  ON eq.id  = eq_q.quiz_id
        JOIN public.elearning_subparts       es  ON es.id  = eq.subpart_id
        JOIN public.elearning_chapters       ec  ON ec.id  = es.chapter_id
        JOIN public.elearning_formations     ef  ON ef.id  = ec.formation_id
        WHERE eq_q.id = elearning_quiz_answers.question_id
        AND ef.is_free_access = true
      )
    )
  );

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

-- 5. Mettre à jour l'ancienne fonction de validation (signature à 1 argument)
-- L'ancienne fonction vérifiait `IS DISTINCT FROM 'premium_gold'` — remplacer par IN ('premium', 'admin')
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

-- 6. Corriger la contrainte subscription_type sur referral_transactions
-- L'ancienne contrainte n'acceptait que 'premium_silver' et 'premium_gold' — ajouter 'premium'
ALTER TABLE public.referral_transactions
  DROP CONSTRAINT IF EXISTS referral_transactions_subscription_type_check;
ALTER TABLE public.referral_transactions
  ADD CONSTRAINT referral_transactions_subscription_type_check
  CHECK (subscription_type = ANY (ARRAY['premium_silver'::text, 'premium_gold'::text, 'premium'::text]));

-- 7. Supprimer les tables liées aux séminaires (plus utilisées)
DROP TABLE IF EXISTS seminar_registrations CASCADE;
DROP TABLE IF EXISTS seminars CASCADE;
