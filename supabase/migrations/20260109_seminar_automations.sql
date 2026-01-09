-- ============================================================================
-- Migration: Automatisations d'emails pour les séminaires
-- Description: Création des templates, automatisations et déclencheurs
--              pour gérer les inscriptions et rappels de séminaires
-- Date: 2026-01-09
-- ============================================================================

-- ============================================================================
-- PARTIE 1: TEMPLATES D'EMAILS
-- ============================================================================

-- Template 1: Confirmation d'inscription au séminaire
INSERT INTO mail_templates (name, subject, description, html, text) VALUES
('seminar-registration-confirmation',
 'Confirmation d''inscription - {{seminar_title}}',
 'Email de confirmation envoyé immédiatement après l''inscription à un séminaire',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Inscription confirmée !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>{{user_name}}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Votre inscription au séminaire <strong>{{seminar_title}}</strong> a bien été enregistrée !
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">📅 Détails du séminaire</h3>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 10px;"><strong>📍 Lieu :</strong> {{seminar_location}}</li>
        <li style="margin-bottom: 10px;"><strong>📆 Date de début :</strong> {{seminar_start_date}}</li>
        <li style="margin-bottom: 10px;"><strong>📆 Date de fin :</strong> {{seminar_end_date}}</li>
        <li style="margin-bottom: 10px;"><strong>👨‍🏫 Formateur :</strong> {{seminar_facilitator}}</li>
        <li style="margin-bottom: 10px;"><strong>🎯 Thème :</strong> {{seminar_theme}}</li>
      </ul>
    </div>

    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; color: #856404;">
        <strong>💡 À noter :</strong> Vous recevrez des rappels avant le séminaire pour vous aider à vous préparer.
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
      À très bientôt !<br>
      L''équipe OstéoUpgrade
    </p>
  </div>
</body>
</html>',
'Bonjour {{user_name}},

Votre inscription au séminaire "{{seminar_title}}" a bien été enregistrée !

DÉTAILS DU SÉMINAIRE :
- Lieu : {{seminar_location}}
- Date de début : {{seminar_start_date}}
- Date de fin : {{seminar_end_date}}
- Formateur : {{seminar_facilitator}}
- Thème : {{seminar_theme}}

Vous recevrez des rappels avant le séminaire pour vous aider à vous préparer.

À très bientôt !
L''équipe OstéoUpgrade');

-- Template 2: Annulation d'inscription au séminaire
INSERT INTO mail_templates (name, subject, description, html, text) VALUES
('seminar-cancellation-confirmation',
 'Annulation confirmée - {{seminar_title}}',
 'Email de confirmation envoyé après l''annulation d''une inscription à un séminaire',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Inscription annulée</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>{{user_name}}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Votre inscription au séminaire <strong>{{seminar_title}}</strong> a bien été annulée.
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f5576c;">
      <h3 style="margin-top: 0; color: #f5576c;">📋 Récapitulatif</h3>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 10px;"><strong>Séminaire :</strong> {{seminar_title}}</li>
        <li style="margin-bottom: 10px;"><strong>Date :</strong> {{seminar_start_date}}</li>
        <li style="margin-bottom: 10px;"><strong>Lieu :</strong> {{seminar_location}}</li>
      </ul>
    </div>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Nous espérons vous revoir bientôt lors d''un prochain séminaire !
    </p>

    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
      <p style="margin: 0; color: #0c5460;">
        <strong>💡 Bon à savoir :</strong> Vous pouvez consulter tous nos séminaires disponibles sur votre espace membre.
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
      À bientôt !<br>
      L''équipe OstéoUpgrade
    </p>
  </div>
</body>
</html>',
'Bonjour {{user_name}},

Votre inscription au séminaire "{{seminar_title}}" a bien été annulée.

RÉCAPITULATIF :
- Séminaire : {{seminar_title}}
- Date : {{seminar_start_date}}
- Lieu : {{seminar_location}}

Nous espérons vous revoir bientôt lors d''un prochain séminaire !

Vous pouvez consulter tous nos séminaires disponibles sur votre espace membre.

À bientôt !
L''équipe OstéoUpgrade');

-- Template 3: Rappel 1 mois avant le séminaire
INSERT INTO mail_templates (name, subject, description, html, text) VALUES
('seminar-reminder-1-month',
 'Dans 1 mois : {{seminar_title}}',
 'Rappel envoyé 1 mois avant le début du séminaire',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Plus qu''un mois !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>{{user_name}}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Le séminaire <strong>{{seminar_title}}</strong> commence dans <strong style="color: #667eea;">1 mois</strong> !
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">📅 Rappel des informations</h3>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 10px;"><strong>📍 Lieu :</strong> {{seminar_location}}</li>
        <li style="margin-bottom: 10px;"><strong>📆 Date de début :</strong> {{seminar_start_date}}</li>
        <li style="margin-bottom: 10px;"><strong>📆 Date de fin :</strong> {{seminar_end_date}}</li>
        <li style="margin-bottom: 10px;"><strong>👨‍🏫 Formateur :</strong> {{seminar_facilitator}}</li>
        <li style="margin-bottom: 10px;"><strong>🎯 Thème :</strong> {{seminar_theme}}</li>
      </ul>
    </div>

    <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3;">
      <h4 style="margin-top: 0; color: #0c5460;">📝 Préparez-vous !</h4>
      <p style="margin: 0; color: #0c5460;">
        C''est le moment idéal pour :<br>
        • Organiser votre planning<br>
        • Réserver votre hébergement si nécessaire<br>
        • Préparer vos questions pour le formateur
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
      À très bientôt !<br>
      L''équipe OstéoUpgrade
    </p>
  </div>
</body>
</html>',
'Bonjour {{user_name}},

Le séminaire "{{seminar_title}}" commence dans 1 mois !

RAPPEL DES INFORMATIONS :
- Lieu : {{seminar_location}}
- Date de début : {{seminar_start_date}}
- Date de fin : {{seminar_end_date}}
- Formateur : {{seminar_facilitator}}
- Thème : {{seminar_theme}}

PRÉPAREZ-VOUS :
• Organiser votre planning
• Réserver votre hébergement si nécessaire
• Préparer vos questions pour le formateur

À très bientôt !
L''équipe OstéoUpgrade');

-- Template 4: Rappel 1 semaine avant le séminaire
INSERT INTO mail_templates (name, subject, description, html, text) VALUES
('seminar-reminder-1-week',
 'C''est pour bientôt ! {{seminar_title}}',
 'Rappel envoyé 1 semaine avant le début du séminaire',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚀 Plus qu''une semaine !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>{{user_name}}</strong>,</p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Le grand jour approche ! Le séminaire <strong>{{seminar_title}}</strong> commence dans <strong style="color: #f5576c;">7 jours</strong> !
    </p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f5576c;">
      <h3 style="margin-top: 0; color: #f5576c;">📅 Dernières informations pratiques</h3>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 10px;"><strong>📍 Lieu :</strong> {{seminar_location}}</li>
        <li style="margin-bottom: 10px;"><strong>📆 Date de début :</strong> {{seminar_start_date}}</li>
        <li style="margin-bottom: 10px;"><strong>📆 Date de fin :</strong> {{seminar_end_date}}</li>
        <li style="margin-bottom: 10px;"><strong>👨‍🏫 Formateur :</strong> {{seminar_facilitator}}</li>
      </ul>
    </div>

    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <h4 style="margin-top: 0; color: #856404;">✅ Checklist de dernière minute</h4>
      <p style="margin: 0; color: #856404;">
        • Confirmez votre hébergement<br>
        • Préparez votre matériel (cahier, stylos...)<br>
        • Vérifiez votre itinéraire<br>
        • Relisez le programme du séminaire
      </p>
    </div>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Nous sommes impatients de vous retrouver !
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
      À très bientôt !<br>
      L''équipe OstéoUpgrade
    </p>
  </div>
</body>
</html>',
'Bonjour {{user_name}},

Le grand jour approche ! Le séminaire "{{seminar_title}}" commence dans 7 jours !

DERNIÈRES INFORMATIONS PRATIQUES :
- Lieu : {{seminar_location}}
- Date de début : {{seminar_start_date}}
- Date de fin : {{seminar_end_date}}
- Formateur : {{seminar_facilitator}}

CHECKLIST DE DERNIÈRE MINUTE :
✅ Confirmez votre hébergement
✅ Préparez votre matériel (cahier, stylos...)
✅ Vérifiez votre itinéraire
✅ Relisez le programme du séminaire

Nous sommes impatients de vous retrouver !

À très bientôt !
L''équipe OstéoUpgrade');

-- Template 5: Rappel veille du séminaire
INSERT INTO mail_templates (name, subject, description, html, text) VALUES
('seminar-reminder-1-day',
 '🎉 C''est demain ! {{seminar_title}}',
 'Rappel envoyé la veille du début du séminaire',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px;">🎉 C''est demain !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px;">Bonjour <strong>{{user_name}}</strong>,</p>

    <p style="font-size: 18px; margin-bottom: 25px; color: #4facfe; font-weight: bold;">
      Le séminaire <strong>{{seminar_title}}</strong> commence <span style="background: #ffd700; color: #333; padding: 2px 8px; border-radius: 4px;">DEMAIN</span> !
    </p>

    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center;">
      <h2 style="margin: 0 0 15px 0; font-size: 24px;">📍 RENDEZ-VOUS</h2>
      <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px;">
        <p style="margin: 5px 0; font-size: 18px;"><strong>📆 {{seminar_start_date}}</strong></p>
        <p style="margin: 5px 0; font-size: 18px;"><strong>📍 {{seminar_location}}</strong></p>
      </div>
    </div>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4facfe;">
      <h3 style="margin-top: 0; color: #4facfe;">👨‍🏫 Informations du séminaire</h3>
      <ul style="list-style: none; padding: 0;">
        <li style="margin-bottom: 10px;"><strong>Formateur :</strong> {{seminar_facilitator}}</li>
        <li style="margin-bottom: 10px;"><strong>Thème :</strong> {{seminar_theme}}</li>
        <li style="margin-bottom: 10px;"><strong>Fin :</strong> {{seminar_end_date}}</li>
      </ul>
    </div>

    <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
      <h4 style="margin-top: 0; color: #155724;">💼 N''oubliez pas !</h4>
      <p style="margin: 5px 0; color: #155724;">
        ✅ Votre matériel de prise de notes<br>
        ✅ Une tenue confortable<br>
        ✅ Votre bonne humeur et votre motivation !
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <p style="font-size: 20px; color: #667eea; font-weight: bold; margin: 0;">
        Nous avons hâte de vous voir ! 🎊
      </p>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center;">
      À demain !<br>
      L''équipe OstéoUpgrade
    </p>
  </div>
</body>
</html>',
'Bonjour {{user_name}},

🎉 C''EST DEMAIN ! 🎉

Le séminaire "{{seminar_title}}" commence DEMAIN !

RENDEZ-VOUS :
📆 {{seminar_start_date}}
📍 {{seminar_location}}

INFORMATIONS DU SÉMINAIRE :
- Formateur : {{seminar_facilitator}}
- Thème : {{seminar_theme}}
- Fin : {{seminar_end_date}}

N''OUBLIEZ PAS :
✅ Votre matériel de prise de notes
✅ Une tenue confortable
✅ Votre bonne humeur et votre motivation !

Nous avons hâte de vous voir !

À demain !
L''équipe OstéoUpgrade');


-- ============================================================================
-- PARTIE 2: AUTOMATISATIONS
-- ============================================================================

-- Automatisation 1: Inscription au séminaire (envoi immédiat)
INSERT INTO mail_automations (name, description, trigger_event, active) VALUES
('Inscription séminaire - Confirmation',
 'Envoi automatique d''un email de confirmation lors de l''inscription à un séminaire',
 'seminar_registration_created',
 true);

-- Récupérer l'ID de l'automatisation qu'on vient de créer
DO $$
DECLARE
  automation_id_inscription uuid;
  automation_id_cancellation uuid;
  automation_id_1month uuid;
  automation_id_1week uuid;
  automation_id_1day uuid;
BEGIN
  -- Récupérer les IDs des automatisations
  SELECT id INTO automation_id_inscription FROM mail_automations WHERE trigger_event = 'seminar_registration_created';

  -- Créer l'étape pour l'automatisation d'inscription (envoi immédiat)
  INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
  VALUES (
    automation_id_inscription,
    1,
    0, -- Envoi immédiat
    'Confirmation d''inscription - {{seminar_title}}',
    'seminar-registration-confirmation',
    '{}'::jsonb
  );
END $$;

-- Automatisation 2: Désinscription du séminaire
INSERT INTO mail_automations (name, description, trigger_event, active) VALUES
('Désinscription séminaire - Confirmation',
 'Envoi automatique d''un email de confirmation lors de l''annulation d''une inscription à un séminaire',
 'seminar_registration_cancelled',
 true);

DO $$
DECLARE
  automation_id_cancellation uuid;
BEGIN
  SELECT id INTO automation_id_cancellation FROM mail_automations WHERE trigger_event = 'seminar_registration_cancelled';

  INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
  VALUES (
    automation_id_cancellation,
    1,
    0, -- Envoi immédiat
    'Annulation confirmée - {{seminar_title}}',
    'seminar-cancellation-confirmation',
    '{}'::jsonb
  );
END $$;

-- Automatisation 3: Rappel 1 mois avant le séminaire
INSERT INTO mail_automations (name, description, trigger_event, active) VALUES
('Séminaire - Rappel 1 mois',
 'Rappel automatique envoyé 1 mois avant le début du séminaire',
 'seminar_reminder_1_month',
 true);

DO $$
DECLARE
  automation_id_1month uuid;
BEGIN
  SELECT id INTO automation_id_1month FROM mail_automations WHERE trigger_event = 'seminar_reminder_1_month';

  INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
  VALUES (
    automation_id_1month,
    1,
    0, -- Envoi immédiat quand déclenché par le cron
    'Dans 1 mois : {{seminar_title}}',
    'seminar-reminder-1-month',
    '{}'::jsonb
  );
END $$;

-- Automatisation 4: Rappel 1 semaine avant le séminaire
INSERT INTO mail_automations (name, description, trigger_event, active) VALUES
('Séminaire - Rappel 1 semaine',
 'Rappel automatique envoyé 1 semaine avant le début du séminaire',
 'seminar_reminder_1_week',
 true);

DO $$
DECLARE
  automation_id_1week uuid;
BEGIN
  SELECT id INTO automation_id_1week FROM mail_automations WHERE trigger_event = 'seminar_reminder_1_week';

  INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
  VALUES (
    automation_id_1week,
    1,
    0, -- Envoi immédiat quand déclenché par le cron
    'C''est pour bientôt ! {{seminar_title}}',
    'seminar-reminder-1-week',
    '{}'::jsonb
  );
END $$;

-- Automatisation 5: Rappel veille du séminaire
INSERT INTO mail_automations (name, description, trigger_event, active) VALUES
('Séminaire - Rappel veille',
 'Rappel automatique envoyé la veille du début du séminaire',
 'seminar_reminder_1_day',
 true);

DO $$
DECLARE
  automation_id_1day uuid;
BEGIN
  SELECT id INTO automation_id_1day FROM mail_automations WHERE trigger_event = 'seminar_reminder_1_day';

  INSERT INTO mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug, payload)
  VALUES (
    automation_id_1day,
    1,
    0, -- Envoi immédiat quand déclenché par le cron
    '🎉 C''est demain ! {{seminar_title}}',
    'seminar-reminder-1-day',
    '{}'::jsonb
  );
END $$;


-- ============================================================================
-- PARTIE 3: FONCTION POUR ENRÔLER AUTOMATIQUEMENT LES UTILISATEURS
-- ============================================================================

-- Fonction pour enrôler un utilisateur dans l'automatisation d'inscription
CREATE OR REPLACE FUNCTION enroll_user_in_seminar_automation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_automation_id uuid;
  v_contact_id uuid;
  v_user_email text;
  v_user_name text;
  v_seminar_data jsonb;
BEGIN
  -- Récupérer les informations de l'utilisateur
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Récupérer les informations du séminaire
  SELECT jsonb_build_object(
    'seminar_id', s.id,
    'seminar_title', s.title,
    'seminar_location', s.location,
    'seminar_start_date', s.start_date,
    'seminar_end_date', s.end_date,
    'seminar_facilitator', COALESCE(s.facilitator, 'À confirmer'),
    'seminar_theme', COALESCE(s.theme, ''),
    'user_name', COALESCE(v_user_name, 'Cher membre')
  ) INTO v_seminar_data
  FROM seminars s
  WHERE s.id = NEW.seminar_id;

  -- Récupérer ou créer le contact dans mail_contacts
  SELECT id INTO v_contact_id
  FROM mail_contacts
  WHERE email = v_user_email;

  IF v_contact_id IS NULL THEN
    INSERT INTO mail_contacts (email, first_name, status, metadata)
    VALUES (
      v_user_email,
      v_user_name,
      'subscribed',
      v_seminar_data
    )
    RETURNING id INTO v_contact_id;
  ELSE
    -- Mettre à jour les métadonnées avec les infos du séminaire
    UPDATE mail_contacts
    SET metadata = metadata || v_seminar_data,
        updated_at = now()
    WHERE id = v_contact_id;
  END IF;

  -- Récupérer l'automatisation d'inscription
  SELECT id INTO v_automation_id
  FROM mail_automations
  WHERE trigger_event = 'seminar_registration_created' AND active = true
  LIMIT 1;

  -- Enrôler le contact dans l'automatisation
  IF v_automation_id IS NOT NULL THEN
    INSERT INTO mail_automation_enrollments (
      automation_id,
      contact_id,
      status,
      next_step_order,
      metadata,
      created_at
    )
    VALUES (
      v_automation_id,
      v_contact_id,
      'pending',
      1,
      v_seminar_data,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Fonction pour enrôler un utilisateur dans l'automatisation de désinscription
CREATE OR REPLACE FUNCTION enroll_user_in_seminar_cancellation_automation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_automation_id uuid;
  v_contact_id uuid;
  v_user_email text;
  v_user_name text;
  v_seminar_data jsonb;
BEGIN
  -- Récupérer les informations de l'utilisateur
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM profiles
  WHERE id = OLD.user_id;

  -- Récupérer les informations du séminaire
  SELECT jsonb_build_object(
    'seminar_id', s.id,
    'seminar_title', s.title,
    'seminar_location', s.location,
    'seminar_start_date', s.start_date,
    'seminar_end_date', s.end_date,
    'seminar_facilitator', COALESCE(s.facilitator, 'À confirmer'),
    'seminar_theme', COALESCE(s.theme, ''),
    'user_name', COALESCE(v_user_name, 'Cher membre')
  ) INTO v_seminar_data
  FROM seminars s
  WHERE s.id = OLD.seminar_id;

  -- Récupérer le contact
  SELECT id INTO v_contact_id
  FROM mail_contacts
  WHERE email = v_user_email;

  -- Si le contact n'existe pas, on le crée quand même
  IF v_contact_id IS NULL THEN
    INSERT INTO mail_contacts (email, first_name, status, metadata)
    VALUES (
      v_user_email,
      v_user_name,
      'subscribed',
      v_seminar_data
    )
    RETURNING id INTO v_contact_id;
  ELSE
    -- Mettre à jour les métadonnées
    UPDATE mail_contacts
    SET metadata = metadata || v_seminar_data,
        updated_at = now()
    WHERE id = v_contact_id;
  END IF;

  -- Récupérer l'automatisation de désinscription
  SELECT id INTO v_automation_id
  FROM mail_automations
  WHERE trigger_event = 'seminar_registration_cancelled' AND active = true
  LIMIT 1;

  -- Enrôler le contact dans l'automatisation
  IF v_automation_id IS NOT NULL THEN
    INSERT INTO mail_automation_enrollments (
      automation_id,
      contact_id,
      status,
      next_step_order,
      metadata,
      created_at
    )
    VALUES (
      v_automation_id,
      v_contact_id,
      'pending',
      1,
      v_seminar_data,
      now()
    );
  END IF;

  RETURN OLD;
END;
$$;


-- ============================================================================
-- PARTIE 4: TRIGGERS SUR LA TABLE seminar_registrations
-- ============================================================================

-- Trigger pour l'inscription (AFTER INSERT)
DROP TRIGGER IF EXISTS trigger_seminar_registration_created ON seminar_registrations;
CREATE TRIGGER trigger_seminar_registration_created
  AFTER INSERT ON seminar_registrations
  FOR EACH ROW
  EXECUTE FUNCTION enroll_user_in_seminar_automation();

-- Trigger pour la désinscription (AFTER DELETE)
DROP TRIGGER IF EXISTS trigger_seminar_registration_cancelled ON seminar_registrations;
CREATE TRIGGER trigger_seminar_registration_cancelled
  AFTER DELETE ON seminar_registrations
  FOR EACH ROW
  EXECUTE FUNCTION enroll_user_in_seminar_cancellation_automation();


-- ============================================================================
-- PARTIE 5: FONCTION POUR ANNULER LES RAPPELS EN CAS DE DÉSINSCRIPTION
-- ============================================================================

-- Fonction pour annuler tous les enrollments de rappels pour un utilisateur qui se désinscrit
CREATE OR REPLACE FUNCTION cancel_seminar_reminder_enrollments()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_contact_id uuid;
  v_user_email text;
BEGIN
  -- Récupérer l'email de l'utilisateur
  SELECT email INTO v_user_email
  FROM profiles
  WHERE id = OLD.user_id;

  -- Récupérer le contact_id
  SELECT id INTO v_contact_id
  FROM mail_contacts
  WHERE email = v_user_email;

  -- Annuler tous les enrollments de rappels pour ce séminaire
  IF v_contact_id IS NOT NULL THEN
    UPDATE mail_automation_enrollments
    SET status = 'cancelled'
    WHERE contact_id = v_contact_id
      AND automation_id IN (
        SELECT id FROM mail_automations
        WHERE trigger_event IN (
          'seminar_reminder_1_month',
          'seminar_reminder_1_week',
          'seminar_reminder_1_day'
        )
      )
      AND status IN ('pending', 'processing')
      AND metadata->>'seminar_id' = OLD.seminar_id::text;
  END IF;

  RETURN OLD;
END;
$$;

-- Trigger pour annuler les rappels lors de la désinscription
DROP TRIGGER IF EXISTS trigger_cancel_seminar_reminders ON seminar_registrations;
CREATE TRIGGER trigger_cancel_seminar_reminders
  BEFORE DELETE ON seminar_registrations
  FOR EACH ROW
  EXECUTE FUNCTION cancel_seminar_reminder_enrollments();


-- ============================================================================
-- PARTIE 6: COMMENTAIRES ET DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION enroll_user_in_seminar_automation() IS
'Enrôle automatiquement un utilisateur dans l''automatisation de confirmation d''inscription lors de l''inscription à un séminaire';

COMMENT ON FUNCTION enroll_user_in_seminar_cancellation_automation() IS
'Enrôle automatiquement un utilisateur dans l''automatisation de confirmation d''annulation lors de la désinscription d''un séminaire';

COMMENT ON FUNCTION cancel_seminar_reminder_enrollments() IS
'Annule tous les enrollments de rappels en attente pour un utilisateur qui se désinscrit d''un séminaire';

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
