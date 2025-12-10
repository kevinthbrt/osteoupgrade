-- 🔍 SCRIPT DE DIAGNOSTIC - Problème de remplacement des variables dans les emails

-- 1️⃣ Vérifier les enrollments existants et leurs métadonnées
SELECT
  e.id,
  e.created_at,
  e.status,
  e.metadata,  -- ⚠️ Si vide ({}), le problème vient de là !
  c.email,
  a.name as automation_name,
  a.trigger_event
FROM mail_automation_enrollments e
JOIN mail_contacts c ON e.contact_id = c.id
JOIN mail_automations a ON e.automation_id = a.id
WHERE a.trigger_event = 'Renouvellement imminent'
ORDER BY e.created_at DESC
LIMIT 10;

-- 2️⃣ Vérifier les templates et leurs IDs
SELECT
  id,
  name,
  subject,
  LEFT(html, 100) as html_preview
FROM mail_templates
WHERE name LIKE '%Renouvellement%'
ORDER BY created_at DESC;

-- 3️⃣ Vérifier les automation steps et leurs template_slug
SELECT
  s.id,
  s.step_order,
  s.subject,
  s.template_slug,  -- ⚠️ Doit correspondre à un ID de mail_templates !
  s.payload,
  a.name as automation_name
FROM mail_automation_steps s
JOIN mail_automations a ON s.automation_id = a.id
WHERE a.trigger_event = 'Renouvellement imminent'
ORDER BY s.step_order;

-- 4️⃣ Vérifier si le template_slug correspond à un template existant
SELECT
  s.template_slug,
  CASE
    WHEN t.id IS NOT NULL THEN '✅ Template trouvé'
    ELSE '❌ ERREUR: Template introuvable !'
  END as status,
  t.name as template_name
FROM mail_automation_steps s
JOIN mail_automations a ON s.automation_id = a.id
LEFT JOIN mail_templates t ON s.template_slug = t.id::text
WHERE a.trigger_event = 'Renouvellement imminent';

-- 5️⃣ Vérifier les contacts et leurs métadonnées
SELECT
  id,
  email,
  first_name,
  last_name,
  metadata
FROM mail_contacts
WHERE email = 'osteo.thubert@gmail.com';

-- 🔧 SOLUTIONS SELON LE DIAGNOSTIC :

-- ✅ Si le problème vient des métadonnées vides (metadata = {}) :
-- Solution : Supprimer les anciens enrollments et relancer le trigger

/*
DELETE FROM mail_automation_enrollments
WHERE contact_id IN (
  SELECT id FROM mail_contacts WHERE email = 'osteo.thubert@gmail.com'
)
AND automation_id IN (
  SELECT id FROM mail_automations WHERE trigger_event = 'Renouvellement imminent'
);

-- Puis réinitialiser le flag de notification
UPDATE profiles
SET commitment_renewal_notification_sent = false
WHERE email = 'osteo.thubert@gmail.com';
*/

-- ✅ Si le problème vient du template_slug qui ne correspond pas :
-- Solution : Mettre à jour le template_slug avec le bon ID

/*
-- D'abord, trouver l'ID du bon template :
SELECT id, name FROM mail_templates WHERE name LIKE '%Renouvellement%';

-- Puis mettre à jour le step :
UPDATE mail_automation_steps
SET template_slug = 'ID_DU_TEMPLATE_ICI'
WHERE automation_id IN (
  SELECT id FROM mail_automations WHERE trigger_event = 'Renouvellement imminent'
);
*/
