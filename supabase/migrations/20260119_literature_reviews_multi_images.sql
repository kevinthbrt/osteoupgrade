-- Migration pour ajouter le support multi-images
-- Créé le 2026-01-19

-- Ajouter le champ images pour stocker plusieurs images avec leurs positions
ALTER TABLE public.literature_reviews
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Commentaire pour la documentation
COMMENT ON COLUMN public.literature_reviews.images IS
'Tableau JSON d''images avec leurs positions : [{"url": "...", "position": "hero|introduction|contexte|methodologie|resultats|conclusion", "caption": "..."}]';

-- Index GIN pour les requêtes sur les images
CREATE INDEX IF NOT EXISTS idx_literature_reviews_images
ON public.literature_reviews USING gin(images);
