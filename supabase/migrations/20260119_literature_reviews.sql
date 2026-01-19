-- Migration pour la Revue de Littérature Mensuelle
-- Créé le 2026-01-19

-- Table principale pour les articles de revue de littérature
CREATE TABLE IF NOT EXISTS public.literature_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT NOT NULL, -- Résumé court pour les cards
    content_html TEXT NOT NULL, -- Contenu riche HTML de l'article
    image_url TEXT, -- URL de l'image d'illustration
    study_url TEXT, -- Lien vers l'étude originale
    published_date DATE NOT NULL, -- Date de publication (mois/année)
    is_featured BOOLEAN DEFAULT false, -- Article mis en avant en grand format
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table des tags/catégories prédéfinis
CREATE TABLE IF NOT EXISTS public.literature_review_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- Nom du tag (ex: "Lombaire", "Cervical", "Pédiatrie")
    slug TEXT NOT NULL UNIQUE, -- Version URL-friendly
    color TEXT DEFAULT '#3b82f6', -- Couleur pour l'affichage (hex)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison many-to-many entre articles et tags
CREATE TABLE IF NOT EXISTS public.literature_review_tag_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.literature_reviews(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.literature_review_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, tag_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_literature_reviews_published_date
    ON public.literature_reviews(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_literature_reviews_featured
    ON public.literature_reviews(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_literature_tag_assoc_review
    ON public.literature_review_tag_associations(review_id);
CREATE INDEX IF NOT EXISTS idx_literature_tag_assoc_tag
    ON public.literature_review_tag_associations(tag_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_literature_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER set_literature_review_updated_at
    BEFORE UPDATE ON public.literature_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_literature_review_updated_at();

-- Row Level Security (RLS) Policies

-- Activer RLS
ALTER TABLE public.literature_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.literature_review_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.literature_review_tag_associations ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can view literature reviews"
    ON public.literature_reviews
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view tags"
    ON public.literature_review_tags
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view tag associations"
    ON public.literature_review_tag_associations
    FOR SELECT
    TO authenticated
    USING (true);

-- Politique d'écriture : Seuls les admins peuvent créer/modifier/supprimer
CREATE POLICY "Admins can insert literature reviews"
    ON public.literature_reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update literature reviews"
    ON public.literature_reviews
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete literature reviews"
    ON public.literature_reviews
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Politiques similaires pour les tags (admin seulement)
CREATE POLICY "Admins can manage tags"
    ON public.literature_review_tags
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage tag associations"
    ON public.literature_review_tag_associations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Insertion de tags par défaut basés sur les topographies existantes
INSERT INTO public.literature_review_tags (name, slug, color) VALUES
    ('Rachis Cervical', 'rachis-cervical', '#ef4444'),
    ('Rachis Thoracique', 'rachis-thoracique', '#f97316'),
    ('Rachis Lombaire', 'rachis-lombaire', '#f59e0b'),
    ('Bassin & Sacrum', 'bassin-sacrum', '#eab308'),
    ('Hanche', 'hanche', '#84cc16'),
    ('Genou', 'genou', '#22c55e'),
    ('Cheville & Pied', 'cheville-pied', '#10b981'),
    ('Épaule', 'epaule', '#14b8a6'),
    ('Coude', 'coude', '#06b6d4'),
    ('Poignet & Main', 'poignet-main', '#0ea5e9'),
    ('Pédiatrie', 'pediatrie', '#3b82f6'),
    ('Gériatrie', 'geriatrie', '#6366f1'),
    ('Sport', 'sport', '#8b5cf6'),
    ('Neurologie', 'neurologie', '#a855f7'),
    ('Viscéral', 'visceral', '#d946ef'),
    ('Crânien', 'cranien', '#ec4899'),
    ('Méthodologie', 'methodologie', '#f43f5e'),
    ('Recherche Fondamentale', 'recherche-fondamentale', '#64748b')
ON CONFLICT (slug) DO NOTHING;

-- Commentaires pour la documentation
COMMENT ON TABLE public.literature_reviews IS 'Articles de revue de littérature mensuelle sur l''ostéopathie et la thérapie manuelle';
COMMENT ON COLUMN public.literature_reviews.is_featured IS 'Article mis en avant en grand format sur la page principale';
COMMENT ON COLUMN public.literature_reviews.published_date IS 'Date de publication de l''article (utilisée pour l''organisation chronologique)';
COMMENT ON TABLE public.literature_review_tags IS 'Tags/catégories thématiques pour filtrer les articles';
COMMENT ON TABLE public.literature_review_tag_associations IS 'Association many-to-many entre articles et tags';
