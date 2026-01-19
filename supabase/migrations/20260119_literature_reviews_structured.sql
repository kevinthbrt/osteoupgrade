-- Migration pour ajouter le champ content_structured
-- Créé le 2026-01-19

-- Ajouter le champ content_structured pour stocker les données structurées
ALTER TABLE public.literature_reviews
ADD COLUMN IF NOT EXISTS content_structured JSONB;

-- Commentaire pour la documentation
COMMENT ON COLUMN public.literature_reviews.content_structured IS 'Contenu structuré de l''article (introduction, contexte, méthodologie, résultats, implications, conclusion)';

-- Index pour les requêtes sur le contenu structuré si nécessaire
CREATE INDEX IF NOT EXISTS idx_literature_reviews_content_structured
ON public.literature_reviews USING gin(content_structured);
