-- =============================================================================
-- Migration : correctifs du système de mailing
-- Date : 2026-02-26
-- =============================================================================
-- 1. Ajoute la colonne renewal_reminder_sent_at sur profiles
--    (utilisée par check-renewals pour éviter les doublons d'emails de rappel)
-- 2. Ajoute l'automation "Confirmation - Premium Silver" (trigger manquant)
-- 3. Ajoute l'automation "Renouvellement effectué" (trigger manquant)
-- 4. Ajoute l'automation "Renouvellement imminent" (trigger manquant)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Colonne renewal_reminder_sent_at sur profiles
-- -----------------------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at timestamptz;

-- -----------------------------------------------------------------------------
-- 2. Automation "Confirmation - Premium Silver"
--    trigger_event = 'Passage à Premium Silver'
--    template      = e2222222-2222-2222-2222-222222222222
--    (vérifiez que l'UUID du template correspond bien à celui en base)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_auto_id uuid;
BEGIN
  -- Vérifier que le template Silver existe
  IF EXISTS (
    SELECT 1 FROM mail_templates WHERE id = 'e2222222-2222-2222-2222-222222222222'
  ) THEN
    -- Créer l'automation si elle n'existe pas déjà pour ce trigger
    IF NOT EXISTS (
      SELECT 1 FROM mail_automations WHERE trigger_event = 'Passage à Premium Silver'
    ) THEN
      INSERT INTO mail_automations (name, trigger_event, active)
      VALUES ('Confirmation - Premium Silver', 'Passage à Premium Silver', true)
      RETURNING id INTO v_auto_id;

      INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug)
      VALUES (
        v_auto_id,
        1,
        0,
        'Bienvenue en Premium Silver ! 🚀',
        'e2222222-2222-2222-2222-222222222222'
      );

      RAISE NOTICE 'Automation "Confirmation - Premium Silver" créée (id: %)', v_auto_id;
    ELSE
      RAISE NOTICE 'Automation "Passage à Premium Silver" existe déjà — ignorée';
    END IF;
  ELSE
    RAISE WARNING 'Template e2222222-2222-2222-2222-222222222222 introuvable. Vérifiez l''UUID du template Silver.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Automation "Renouvellement effectué"
--    trigger_event = 'Renouvellement effectué'
--    template      = e5555555-5555-5555-5555-555555555555
--    Déclenchée par invoice.payment_succeeded (hors premier paiement)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_auto_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM mail_templates WHERE id = 'e5555555-5555-5555-5555-555555555555'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM mail_automations WHERE trigger_event = 'Renouvellement effectué'
    ) THEN
      INSERT INTO mail_automations (name, trigger_event, active)
      VALUES ('Confirmation - Renouvellement effectué', 'Renouvellement effectué', true)
      RETURNING id INTO v_auto_id;

      INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug)
      VALUES (
        v_auto_id,
        1,
        0,
        'Votre abonnement a été renouvelé ✅',
        'e5555555-5555-5555-5555-555555555555'
      );

      RAISE NOTICE 'Automation "Renouvellement effectué" créée (id: %)', v_auto_id;
    ELSE
      RAISE NOTICE 'Automation "Renouvellement effectué" existe déjà — ignorée';
    END IF;
  ELSE
    RAISE WARNING 'Template e5555555-5555-5555-5555-555555555555 introuvable. Vérifiez l''UUID du template Renouvellement.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Automation "Renouvellement imminent"
--    trigger_event = 'Renouvellement imminent'
--    template      = e4444444-4444-4444-4444-444444444444
--    Déclenchée par le cron quotidien check-renewals (via Stripe API)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_auto_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM mail_templates WHERE id = 'e4444444-4444-4444-4444-444444444444'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM mail_automations WHERE trigger_event = 'Renouvellement imminent'
    ) THEN
      INSERT INTO mail_automations (name, trigger_event, active)
      VALUES ('Rappel - Renouvellement imminent', 'Renouvellement imminent', true)
      RETURNING id INTO v_auto_id;

      INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug)
      VALUES (
        v_auto_id,
        1,
        0,
        'Votre abonnement se renouvelle dans {{jours}} jours',
        'e4444444-4444-4444-4444-444444444444'
      );

      RAISE NOTICE 'Automation "Renouvellement imminent" créée (id: %)', v_auto_id;
    ELSE
      RAISE NOTICE 'Automation "Renouvellement imminent" existe déjà — ignorée';
    END IF;
  ELSE
    RAISE WARNING 'Template e4444444-4444-4444-4444-444444444444 introuvable. Vérifiez l''UUID du template Rappel.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Reset des enrollments bloqués en status='processing'
-- (laissés par les versions précédentes du worker avant le claim atomique)
-- -----------------------------------------------------------------------------
UPDATE mail_automation_enrollments
SET status = 'pending'
WHERE status = 'processing';
