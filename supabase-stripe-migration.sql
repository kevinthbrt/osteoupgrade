-- Ajouter les colonnes Stripe à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Ajouter un index pour rechercher rapidement par customer_id
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);

-- Commentaires pour documentation
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'ID du client Stripe (commence par cus_)';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'ID de l''abonnement Stripe actif (commence par sub_)';
