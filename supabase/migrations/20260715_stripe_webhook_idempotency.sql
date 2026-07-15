-- Idempotence du webhook Stripe : Stripe peut renvoyer un même événement
-- plusieurs fois (retries sur timeout/erreur). Sans ce garde-fou, un renvoi
-- de checkout.session.completed créditerait deux fois le mois offert de
-- parrainage (argent réel via customer balance) et pourrait redéclencher
-- d'autres effets de bord (emails, notifications).
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id text PRIMARY KEY,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
-- Aucune policy : accessible uniquement via la clé service_role (webhook Stripe).
