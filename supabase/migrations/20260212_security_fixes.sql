-- ============================================================================
-- MIGRATION: Security Fixes + Cleanup Unused Tables - 2026-02-12
-- ============================================================================
--
-- PART A - SECURITY FIXES:
--   1. user_gamification_stats: FOR ALL USING (true) -> restrict to own user_id
--   2. user_achievements: INSERT WITH CHECK (true) -> restrict to own user_id
--   3. practice_categories: auth.jwt() ->> 'role' -> public.profiles lookup
--   4. literature_reviews + tags: public.users -> public.profiles
--   5. profiles: prevent users from changing their own role
--
-- PART B - DROP UNUSED TABLES:
--   6. clinical_cases_v2 system (8 tables - never integrated in app)
--   7. mail_campaigns + mail_campaign_messages (never implemented)
--   8. mail_segments + mail_segment_members (never implemented)
--   9. Standalone quizzes RPC + related (never created, but RPC exists)
--  10. Decision trees + topographic zones + consultation sessions
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART A: SECURITY FIXES
-- ============================================================================

-- ============================================================================
-- 1. FIX: user_gamification_stats - anyone could modify anyone's stats
-- ============================================================================

DROP POLICY IF EXISTS "System can manage stats" ON public.user_gamification_stats;
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_gamification_stats;

-- Users can only read and manage their OWN stats
CREATE POLICY "Users can view own stats"
  ON public.user_gamification_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own stats"
  ON public.user_gamification_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_gamification_stats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all stats (for admin tools)
CREATE POLICY "Admins can manage all gamification stats"
  ON public.user_gamification_stats
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 2. FIX: user_achievements - anyone could grant achievements to anyone
-- ============================================================================

DROP POLICY IF EXISTS "System can create user achievements" ON public.user_achievements;

-- Users can only create achievements for themselves
CREATE POLICY "Users can create own achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all achievements
CREATE POLICY "Admins can manage all achievements"
  ON public.user_achievements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 3. FIX: practice_categories - replace auth.jwt() with public.profiles
-- ============================================================================

DROP POLICY IF EXISTS "Public read access for active categories" ON public.practice_categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.practice_categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.practice_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.practice_categories;

-- Authenticated users can read active categories; admins can read all
CREATE POLICY "Read access for active categories"
  ON public.practice_categories
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin write policies using profiles table
CREATE POLICY "Admins can insert categories"
  ON public.practice_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON public.practice_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON public.practice_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 4. FIX: literature_reviews - replace public.users with public.profiles
-- ============================================================================

-- literature_reviews
DROP POLICY IF EXISTS "Admins can insert literature reviews" ON public.literature_reviews;
DROP POLICY IF EXISTS "Admins can update literature reviews" ON public.literature_reviews;
DROP POLICY IF EXISTS "Admins can delete literature reviews" ON public.literature_reviews;

CREATE POLICY "Admins can insert literature reviews"
  ON public.literature_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update literature reviews"
  ON public.literature_reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete literature reviews"
  ON public.literature_reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- literature_review_tags
DROP POLICY IF EXISTS "Admins can manage tags" ON public.literature_review_tags;

CREATE POLICY "Admins can manage tags"
  ON public.literature_review_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- literature_review_tag_associations
DROP POLICY IF EXISTS "Admins can manage tag associations" ON public.literature_review_tag_associations;

CREATE POLICY "Admins can manage tag associations"
  ON public.literature_review_tag_associations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 5. FIX: profiles - prevent users from escalating their own role
-- ============================================================================

DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

CREATE POLICY "Enable update for users based on id"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role IS NOT DISTINCT FROM (
      SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()
    )
  );


-- ============================================================================
-- PART B: DROP UNUSED TABLES
-- ============================================================================

-- ============================================================================
-- 6. DROP: clinical_cases_v2 system (8 tables - never integrated in app code)
--    Order matters: drop child tables first (foreign key constraints)
-- ============================================================================

DROP TABLE IF EXISTS public.clinical_case_quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.clinical_case_quiz_answers CASCADE;
DROP TABLE IF EXISTS public.clinical_case_quiz_questions CASCADE;
DROP TABLE IF EXISTS public.clinical_case_quizzes CASCADE;
DROP TABLE IF EXISTS public.clinical_case_module_progress CASCADE;
DROP TABLE IF EXISTS public.clinical_case_modules CASCADE;
DROP TABLE IF EXISTS public.clinical_case_chapters CASCADE;
DROP TABLE IF EXISTS public.clinical_case_progress_v2 CASCADE;
DROP TABLE IF EXISTS public.clinical_cases_v2 CASCADE;

-- ============================================================================
-- 7. DROP: mail_campaigns system (never implemented in app code)
-- ============================================================================

DROP TABLE IF EXISTS public.mail_campaign_messages CASCADE;
DROP TABLE IF EXISTS public.mail_campaigns CASCADE;

-- ============================================================================
-- 8. DROP: mail_segments system (never implemented in app code)
-- ============================================================================

DROP TABLE IF EXISTS public.mail_segment_members CASCADE;
DROP TABLE IF EXISTS public.mail_segments CASCADE;

-- ============================================================================
-- 9. DROP: standalone quizzes RPC (the quizzes table was never created,
--    but the search RPC may exist)
-- ============================================================================

DROP FUNCTION IF EXISTS public.search_quizzes(text);

-- ============================================================================
-- 10. DROP: Decision trees + topographic zones + consultation sessions
--     These features are no longer used in the application.
--     Order: child tables first.
-- ============================================================================

-- Drop consultation sessions
DROP TABLE IF EXISTS public.consultation_sessions_v2 CASCADE;
DROP TABLE IF EXISTS public.consultation_sessions_legacy CASCADE;

-- Drop decision tree system
DROP TABLE IF EXISTS public.decision_answers CASCADE;
DROP TABLE IF EXISTS public.decision_nodes CASCADE;
DROP TABLE IF EXISTS public.decision_trees CASCADE;

-- Drop topographic zones (parent of decision_trees)
DROP TABLE IF EXISTS public.topographic_zones CASCADE;

-- Drop anatomical zones (3D anatomy builder - no longer used)
DROP TABLE IF EXISTS public.anatomical_zones CASCADE;

-- Drop test_categories (unused, no app references)
DROP TABLE IF EXISTS public.test_categories CASCADE;

-- Drop the RPC search function for topographic zones
DROP FUNCTION IF EXISTS public.search_topographic_zones(text);

COMMIT;
