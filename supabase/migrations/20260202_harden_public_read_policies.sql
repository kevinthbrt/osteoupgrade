-- Harden public read policies for sensitive lookup tables

-- Orthopedic tests: remove public read
DROP POLICY IF EXISTS "Enable read for all users" ON public.orthopedic_tests;

-- Orthopedic test clusters/items: replace public read with authenticated read
DROP POLICY IF EXISTS "public_read_test_clusters" ON public.orthopedic_test_clusters;
DROP POLICY IF EXISTS "public_read_test_cluster_items" ON public.orthopedic_test_cluster_items;

CREATE POLICY "Authenticated read test clusters"
ON public.orthopedic_test_clusters
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read test cluster items"
ON public.orthopedic_test_cluster_items
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Pathologies: remove public read of active pathologies
DROP POLICY IF EXISTS "Anyone can read active pathologies" ON public.pathologies;

-- Pathology tests/clusters: replace public read with authenticated read
DROP POLICY IF EXISTS "Public read pathology tests" ON public.pathology_tests;
DROP POLICY IF EXISTS "Public read pathology clusters" ON public.pathology_clusters;

CREATE POLICY "Authenticated read pathology tests"
ON public.pathology_tests
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated read pathology clusters"
ON public.pathology_clusters
FOR SELECT
USING (auth.uid() IS NOT NULL);
