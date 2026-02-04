-- Add images JSONB column for multiple image support on clinical case modules
ALTER TABLE public.clinical_case_modules
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Migrate existing image_url data into the images array
UPDATE public.clinical_case_modules
SET images = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND image_url != '' AND (images IS NULL OR images = '[]'::jsonb);
