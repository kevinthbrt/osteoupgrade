-- Migration pour ajouter la relation entre pathologies et clusters de tests
-- Permet d'associer des clusters complets de tests aux diagnostics

-- Créer la table de liaison entre pathologies et clusters (many-to-many)
CREATE TABLE IF NOT EXISTS public.pathology_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathology_id UUID NOT NULL REFERENCES public.pathologies(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES public.orthopedic_test_clusters(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte unique pour éviter les doublons
  UNIQUE(pathology_id, cluster_id)
);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pathology_clusters_pathology_id ON public.pathology_clusters(pathology_id);
CREATE INDEX IF NOT EXISTS idx_pathology_clusters_cluster_id ON public.pathology_clusters(cluster_id);

-- Ajouter un commentaire pour documenter la table
COMMENT ON TABLE public.pathology_clusters IS 'Liaison many-to-many entre pathologies (diagnostics) et clusters de tests orthopédiques. Un cluster peut appartenir à plusieurs diagnostics.';
COMMENT ON COLUMN public.pathology_clusters.order_index IS 'Ordre d''affichage du cluster dans le diagnostic';
