-- Add illustration_url column to rehab_exercises table
-- This allows exercises to have associated images/illustrations

ALTER TABLE rehab_exercises
ADD COLUMN IF NOT EXISTS illustration_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN rehab_exercises.illustration_url IS 'URL of the illustration/image for this exercise';
