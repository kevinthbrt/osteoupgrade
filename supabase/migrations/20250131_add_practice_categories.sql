-- Migration pour ajouter un système de catégories aux vidéos de pratique
-- Permet de catégoriser les vidéos par type de technique (HVLA, Mobilisation, etc.)
-- en plus de la région anatomique existante

-- ============================================================================
-- 1. CRÉATION DE LA TABLE PRACTICE_CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.practice_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- Couleur pour l'UI (format hex)
  icon TEXT, -- Nom de l'icône Lucide React
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_practice_categories_slug ON public.practice_categories(slug);
CREATE INDEX IF NOT EXISTS idx_practice_categories_active ON public.practice_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_practice_categories_order ON public.practice_categories(order_index);

-- ============================================================================
-- 2. AJOUT DE LA COLONNE CATEGORY_ID À PRACTICE_VIDEOS
-- ============================================================================

-- Ajouter la colonne category_id (nullable pour permettre les vidéos existantes)
ALTER TABLE public.practice_videos
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.practice_categories(id) ON DELETE SET NULL;

-- Index pour améliorer les performances de filtrage
CREATE INDEX IF NOT EXISTS idx_practice_videos_category ON public.practice_videos(category_id);

-- ============================================================================
-- 3. INSERTION DES CATÉGORIES INITIALES
-- ============================================================================

INSERT INTO public.practice_categories (name, slug, description, color, icon, order_index)
VALUES
  ('HVLA', 'hvla', 'Techniques de haute vélocité et faible amplitude (thrust)', '#ef4444', 'Zap', 1),
  ('Mobilisation', 'mobilisation', 'Techniques de mobilisation articulaire', '#3b82f6', 'Move', 2),
  ('Manipulation Douce', 'manipulation-douce', 'Techniques de manipulation douce et indirectes', '#10b981', 'Hand', 3),
  ('Muscle Energy', 'muscle-energy', 'Techniques d''énergie musculaire (MET)', '#f59e0b', 'Dumbbell', 4),
  ('Techniques Myofasciales', 'myofasciales', 'Techniques de relâchement myofascial et trigger points', '#8b5cf6', 'ScanFace', 5),
  ('Stretching', 'stretching', 'Techniques d''étirement et de stretching', '#06b6d4', 'Maximize2', 6),
  ('Techniques Viscérales', 'viscerales', 'Techniques viscérales et manipulation organique', '#ec4899', 'HeartPulse', 7),
  ('Techniques Crâniennes', 'craniennes', 'Techniques crâniennes et crânio-sacrées', '#6366f1', 'Brain', 8),
  ('Taping', 'taping', 'Techniques de taping neuromusculaire et thérapeutique', '#14b8a6', 'Sticker', 9),
  ('Autres', 'autres', 'Autres techniques ostéopathiques', '#64748b', 'MoreHorizontal', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 4. RLS (ROW LEVEL SECURITY) POLICIES
-- ============================================================================

-- Activer RLS sur la table practice_categories
ALTER TABLE public.practice_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les catégories actives
CREATE POLICY "Public read access for active categories"
  ON public.practice_categories
  FOR SELECT
  USING (is_active = true OR auth.jwt() ->> 'role' = 'admin');

-- Policy: Seuls les admins peuvent insérer des catégories
CREATE POLICY "Admins can insert categories"
  ON public.practice_categories
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Seuls les admins peuvent modifier des catégories
CREATE POLICY "Admins can update categories"
  ON public.practice_categories
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Seuls les admins peuvent supprimer des catégories
CREATE POLICY "Admins can delete categories"
  ON public.practice_categories
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 5. TRIGGERS POUR AUTO-UPDATE DU TIMESTAMP
-- ============================================================================

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour practice_categories
DROP TRIGGER IF EXISTS set_practice_categories_updated_at ON public.practice_categories;
CREATE TRIGGER set_practice_categories_updated_at
  BEFORE UPDATE ON public.practice_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.practice_categories IS 'Catégories de techniques pour les vidéos de pratique (HVLA, Mobilisation, etc.)';
COMMENT ON COLUMN public.practice_categories.name IS 'Nom de la catégorie affiché dans l''interface';
COMMENT ON COLUMN public.practice_categories.slug IS 'Identifiant unique en format URL-friendly';
COMMENT ON COLUMN public.practice_categories.description IS 'Description de la catégorie';
COMMENT ON COLUMN public.practice_categories.color IS 'Couleur de la catégorie en format hex pour l''interface';
COMMENT ON COLUMN public.practice_categories.icon IS 'Nom de l''icône Lucide React pour l''interface';
COMMENT ON COLUMN public.practice_categories.order_index IS 'Ordre d''affichage de la catégorie';
COMMENT ON COLUMN public.practice_videos.category_id IS 'Référence vers la catégorie de technique';
