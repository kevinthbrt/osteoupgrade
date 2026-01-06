-- Migration: Add free user access for shoulder content
-- Description: Allow free users to access shoulder-related content (courses, tests, diagnostics, topographies, videos)

-- Add is_free_access column to elearning_formations
ALTER TABLE elearning_formations
ADD COLUMN IF NOT EXISTS is_free_access BOOLEAN DEFAULT false;

-- Add is_free_access column to orthopedic_tests
ALTER TABLE orthopedic_tests
ADD COLUMN IF NOT EXISTS is_free_access BOOLEAN DEFAULT false;

-- Add is_free_access column to pathologies
ALTER TABLE pathologies
ADD COLUMN IF NOT EXISTS is_free_access BOOLEAN DEFAULT false;

-- Add is_free_access column to elearning_topographic_views
ALTER TABLE elearning_topographic_views
ADD COLUMN IF NOT EXISTS is_free_access BOOLEAN DEFAULT false;

-- Add is_free_access column to practice_videos
ALTER TABLE practice_videos
ADD COLUMN IF NOT EXISTS is_free_access BOOLEAN DEFAULT false;

-- Mark all shoulder-related content as accessible to free users

-- 1. Mark shoulder orthopedic tests as free access
UPDATE orthopedic_tests
SET is_free_access = true
WHERE category = 'Épaule';

-- 2. Mark shoulder pathologies/diagnostics as free access
UPDATE pathologies
SET is_free_access = true
WHERE region = 'Épaule';

-- 3. Mark shoulder topographies as free access
UPDATE elearning_topographic_views
SET is_free_access = true
WHERE region = 'Épaule';

-- 4. Mark shoulder practice videos as free access
UPDATE practice_videos
SET is_free_access = true
WHERE region = 'Épaule';

-- Update RLS policies for elearning_formations to include free access check
DROP POLICY IF EXISTS "Allow users to view formations" ON elearning_formations;
CREATE POLICY "Allow users to view formations"
ON elearning_formations FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Admin can see everything
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR
    -- Premium users can see non-private courses
    (
      NOT is_private AND
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium_silver', 'premium_gold', 'admin')
    )
    OR
    -- Free users can see courses marked as free access
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- Update RLS policies for orthopedic_tests
DROP POLICY IF EXISTS "Allow authenticated users to view tests" ON orthopedic_tests;
CREATE POLICY "Allow authenticated users to view tests"
ON orthopedic_tests FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Premium and admin users can see all tests
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium_silver', 'premium_gold', 'admin')
    OR
    -- Free users can see tests marked as free access
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- Update RLS policies for pathologies
DROP POLICY IF EXISTS "Allow authenticated users to view pathologies" ON pathologies;
CREATE POLICY "Allow authenticated users to view pathologies"
ON pathologies FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Premium and admin users can see all pathologies
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium_silver', 'premium_gold', 'admin')
    OR
    -- Free users can see pathologies marked as free access
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- Update RLS policies for elearning_topographic_views
DROP POLICY IF EXISTS "Allow authenticated users to view topographic views" ON elearning_topographic_views;
CREATE POLICY "Allow authenticated users to view topographic views"
ON elearning_topographic_views FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Premium and admin users can see all topographic views
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium_silver', 'premium_gold', 'admin')
    OR
    -- Free users can see topographic views marked as free access
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- Update RLS policies for practice_videos
DROP POLICY IF EXISTS "Allow authenticated users to view practice videos" ON practice_videos;
CREATE POLICY "Allow authenticated users to view practice videos"
ON practice_videos FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- Premium and admin users can see all practice videos
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('premium_silver', 'premium_gold', 'admin')
    OR
    -- Free users can see practice videos marked as free access
    (
      is_free_access = true AND
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'free'
    )
  )
);

-- Add comments for documentation
COMMENT ON COLUMN elearning_formations.is_free_access IS 'If true, this formation is accessible to free users';
COMMENT ON COLUMN orthopedic_tests.is_free_access IS 'If true, this test is accessible to free users';
COMMENT ON COLUMN pathologies.is_free_access IS 'If true, this pathology is accessible to free users';
COMMENT ON COLUMN elearning_topographic_views.is_free_access IS 'If true, this topographic view is accessible to free users';
COMMENT ON COLUMN practice_videos.is_free_access IS 'If true, this practice video is accessible to free users';
