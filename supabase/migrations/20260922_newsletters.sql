-- Newsletters rédigées en blocs (Administration → Newsletter)
--
-- La page newsletter ne manipule plus de HTML : l'administrateur empile des
-- blocs (titre, texte, image, bouton, encart, séparateur, espace) et le HTML
-- de l'email est reconstruit à l'envoi par `lib/newsletter.ts`, à partir du
-- gabarit maison (bandeau dégradé violet, corps blanc, encarts lavande, pied
-- de page gris). C'est donc `blocks` qui fait foi, pas un HTML stocké : un
-- correctif apporté au gabarit s'applique aux brouillons déjà écrits.
--
-- `header` porte l'emoji, le titre et le sous-titre du bandeau.
-- `audience` / `subscription_filter` / `delivery_mode` conservent le choix de
-- diffusion pour qu'un envoi soit rejouable à l'identique le mois suivant par
-- simple duplication.
--
-- Le pied de désinscription et les en-têtes List-Unsubscribe restent ajoutés
-- automatiquement à l'envoi : ne rien écrire de tel dans les blocs.

BEGIN;

CREATE TABLE IF NOT EXISTS public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Newsletter',
  subject text NOT NULL DEFAULT '',
  preheader text NOT NULL DEFAULT '',
  header jsonb NOT NULL DEFAULT '{}'::jsonb,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  audience text NOT NULL DEFAULT 'all',
  subscription_filter text,
  delivery_mode text NOT NULL DEFAULT 'marketing',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  sent_count integer,
  broadcast_id text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletters
  DROP CONSTRAINT IF EXISTS newsletters_status_check;
ALTER TABLE public.newsletters
  ADD CONSTRAINT newsletters_status_check CHECK (status IN ('draft', 'sent'));

ALTER TABLE public.newsletters
  DROP CONSTRAINT IF EXISTS newsletters_audience_check;
ALTER TABLE public.newsletters
  ADD CONSTRAINT newsletters_audience_check
  CHECK (audience IN ('all', 'plan', 'prelaunch', 'test'));

ALTER TABLE public.newsletters
  DROP CONSTRAINT IF EXISTS newsletters_delivery_mode_check;
ALTER TABLE public.newsletters
  ADD CONSTRAINT newsletters_delivery_mode_check
  CHECK (delivery_mode IN ('marketing', 'direct'));

-- Le brouillon en cours est celui qu'on rouvre : tri par date de modification.
CREATE INDEX IF NOT EXISTS newsletters_updated_at_idx
  ON public.newsletters (updated_at DESC);

CREATE INDEX IF NOT EXISTS newsletters_status_idx
  ON public.newsletters (status, updated_at DESC);

-- Lecture et écriture réservées aux administrateurs. Le module passe de toute
-- façon par des routes API en clé service-role, la politique n'est là que pour
-- qu'une clé publiable ne puisse rien lire si quelqu'un l'essaie un jour.
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS newsletters_admin_all ON public.newsletters;
CREATE POLICY newsletters_admin_all ON public.newsletters
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- `search_path` figé : sans ça, le linter de Supabase le signale, et un objet
-- créé dans un schéma placé devant `public` pourrait détourner ce que la
-- fonction appelle. Elle n'a besoin que de `now()`, qui vient de `pg_catalog`.
CREATE OR REPLACE FUNCTION public.newsletters_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletters_set_updated_at ON public.newsletters;
CREATE TRIGGER newsletters_set_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.newsletters_touch_updated_at();

COMMENT ON TABLE public.newsletters IS
  'Newsletters rédigées en blocs depuis Administration → Newsletter. `blocks` fait foi : le HTML est reconstruit à l''envoi par lib/newsletter.ts.';
COMMENT ON COLUMN public.newsletters.delivery_mode IS
  'marketing = campagne Resend Broadcasts (quota marketing, désinscription en un clic). direct = envoi transactionnel un par un (quota partagé avec les emails critiques).';

COMMIT;
