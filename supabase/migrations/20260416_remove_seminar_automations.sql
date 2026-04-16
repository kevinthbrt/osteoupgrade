-- Migration: Suppression des automatisations et templates liés aux séminaires
-- Les tables seminars et seminar_registrations ont été supprimées,
-- ces automatisations ne se déclenchent plus jamais.

-- 1. Supprimer les étapes des automatisations séminaires
DELETE FROM mail_automation_steps
WHERE automation_id IN (
  SELECT id FROM mail_automations
  WHERE
    trigger_event ILIKE '%seminar%'
    OR trigger_event ILIKE '%séminaire%'
    OR name ILIKE '%seminar%'
    OR name ILIKE '%séminaire%'
);

-- 2. Supprimer les enrollments liés
DELETE FROM mail_automation_enrollments
WHERE automation_id IN (
  SELECT id FROM mail_automations
  WHERE
    trigger_event ILIKE '%seminar%'
    OR trigger_event ILIKE '%séminaire%'
    OR name ILIKE '%seminar%'
    OR name ILIKE '%séminaire%'
);

-- 3. Supprimer les automatisations elles-mêmes
DELETE FROM mail_automations
WHERE
  trigger_event ILIKE '%seminar%'
  OR trigger_event ILIKE '%séminaire%'
  OR name ILIKE '%seminar%'
  OR name ILIKE '%séminaire%';

-- 4. Supprimer les templates séminaires (slugs connus)
DELETE FROM mail_templates
WHERE name IN (
  'seminar-registration-confirmation',
  'seminar-cancellation-confirmation',
  'seminar-reminder-1-month',
  'seminar-reminder-1-week',
  'seminar-reminder-1-day'
);
