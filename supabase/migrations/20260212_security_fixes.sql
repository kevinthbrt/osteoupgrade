-- ============================================================================
-- MIGRATION: Security Fixes - 2026-02-12
-- ============================================================================
-- Fixes:
--   1. user_gamification_stats: FOR ALL USING (true) -> restrict to own user_id
--   2. user_achievements: INSERT WITH CHECK (true) -> restrict to own user_id
--   3. practice_categories: auth.jwt() ->> 'role' -> public.profiles lookup
--   4. literature_reviews + tags: public.users -> public.profiles
--   5. profiles: prevent users from changing their own role
-- ============================================================================

BEGIN;

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

COMMIT;
