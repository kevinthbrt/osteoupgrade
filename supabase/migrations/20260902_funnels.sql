-- Funnels : pages de vente éditables depuis l'admin
--
-- Trois tables :
--   * `funnels` : la page elle-même. Le contenu est un tableau de blocs
--                       JSONB (`content`), ce qui permet d'ajouter un type de
--                       bloc sans migration. La forme des blocs est validée
--                       côté applicatif (`lib/funnels.ts`), jamais ici : une
--                       contrainte SQL sur du JSON libre se serait figée au
--                       premier bloc ajouté.
--   * `funnel_leads` : les opt-ins (email seul, sans compte). C'est la
--                       différence avec `profiles` : un lead n'est pas un
--                       utilisateur, il n'a pas de ligne dans `auth.users`.
--   * `funnel_events` : vues, clics CTA et départs au paiement, pour mesurer
--                       la conversion par campagne (UTM).
--
-- Lecture publique : AUCUNE politique `anon`. Les pages funnel sont rendues
-- côté serveur avec la clé service-role (cf. `app/f/[slug]/page.tsx`), dans la
-- continuité du durcissement fait en 20260202 : rien de cette table n'est
-- lisible directement depuis le navigateur.

-- L'extension citext est déjà installée (utilisée par mail_contacts.email) ;
-- on la déclare malgré tout pour que la migration soit rejouable seule.
CREATE EXTENSION IF NOT EXISTS citext;

-- ── 1. Table principale ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.funnels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiant d'URL : /f/<slug>
  slug text NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) BETWEEN 2 AND 80),

  -- Nom interne (liste admin), jamais affiché au visiteur
  name text NOT NULL,

  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),

  -- SEO / partage
  meta_title text,
  meta_description text,

  -- Blocs de la page : [{ id, type, ... }]
  content jsonb NOT NULL DEFAULT '[]' : jsonb,

  -- Offre poussée par les CTA (clé de STRIPE_PLANS, ex. 'founding_annual').
  -- NULL = le CTA renvoie vers l'inscription sans offre pré-sélectionnée.
  plan_type text,

  -- Échéance de l'offre.
  --   'none'     : pas de compte à rebours
  --   'fixed'    : même date pour tout le monde (deadline_at)
  --   'relative' : J+N après l'opt-in, propre à chaque lead (deadline_days)
  deadline_mode text NOT NULL DEFAULT 'none'
    CHECK (deadline_mode IN ('none', 'fixed', 'relative')),
  deadline_at timestamptz,
  deadline_days integer CHECK (deadline_days IS NULL OR deadline_days BETWEEN 1 AND 365),

  -- Cohérence : une échéance annoncée doit être calculable.
  CONSTRAINT funnels_deadline_coherent CHECK (
    (deadline_mode = 'none')
    OR (deadline_mode = 'fixed' AND deadline_at IS NOT NULL)
    OR (deadline_mode = 'relative' AND deadline_days IS NOT NULL)
  ),

  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnels_slug_published
  ON public.funnels (slug) WHERE status = 'published';

-- ── 2. Leads (opt-ins sans compte) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.funnel_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,

  -- `citext` comme `mail_contacts.email` : sans ça, « Kevin@x.fr » et
  -- « kevin@x.fr » passeraient la contrainte d'unicité et créeraient deux
  -- leads pour une seule personne.
  email citext NOT NULL,
  full_name text,

  -- Contact créé dans le moteur d'emails existant (mail_contacts).
  contact_id uuid REFERENCES public.mail_contacts(id) ON DELETE SET NULL,

  -- Attribution : d'où vient ce lead.
  utm jsonb NOT NULL DEFAULT '{}' : jsonb,
  referrer text,
  landing_path text,

  -- Échéance individuelle (deadline_mode = 'relative').
  deadline_at timestamptz,

  -- Renseigné si le lead finit par créer un compte (rapprochement par email).
  converted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Un même email ne s'inscrit qu'une fois par funnel : un second envoi du
  -- formulaire met à jour la ligne au lieu d'en créer une deuxième.
  UNIQUE (funnel_id, email)
);

CREATE INDEX IF NOT EXISTS idx_funnel_leads_funnel ON public.funnel_leads (funnel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_funnel_leads_email ON public.funnel_leads (email);

-- ── 3. Événements (mesure) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id bigserial PRIMARY KEY,
  funnel_id uuid NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.funnel_leads(id) ON DELETE SET NULL,

  type text NOT NULL CHECK (type IN ('view', 'cta_click', 'optin', 'checkout_started')),

  -- Identifiant anonyme de session (cookie premier-partie), pour distinguer
  -- deux visiteurs sans jamais stocker d'IP.
  visitor_id text,
  utm jsonb NOT NULL DEFAULT '{}' : jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_funnel ON public.funnel_events (funnel_id, type, created_at DESC);

-- ── 4. updated_at ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_funnels_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_funnels_updated_at ON public.funnels;
CREATE TRIGGER trigger_funnels_updated_at
  BEFORE UPDATE ON public.funnels
  FOR EACH ROW EXECUTE FUNCTION public.update_funnels_updated_at();

-- ── 5. RLS ─────────────────────────────────────────────────────────────────
-- Les trois tables sont fermées au navigateur. Le rendu public passe par la
-- clé service-role côté serveur ; l'admin passe par les routes /api/admin.
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage funnels" ON public.funnels;
CREATE POLICY "Admins manage funnels"
  ON public.funnels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins read funnel leads" ON public.funnel_leads;
CREATE POLICY "Admins read funnel leads"
  ON public.funnel_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins read funnel events" ON public.funnel_events;
CREATE POLICY "Admins read funnel events"
  ON public.funnel_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
