-- Séquence email du funnel « effet placebo ».
--
-- Six emails sur huit jours, articulés autour d'un code de remise personnel
-- créé à l'inscription (voir 20260924_funnel_promo.sql et lib/funnel-promo.ts).
--
-- `wait_minutes` est un délai DEPUIS L'ÉTAPE PRÉCÉDENTE, pas depuis
-- l'inscription : 0, 2880, 2880, 1440, 1440, 2880 place les messages à J+0,
-- J+2, J+4, J+5, J+6 et J+8. Le cinquième tombe donc la veille de l'expiration
-- du code, le sixième deux jours après.
--
-- Les variables {{promo_code}}, {{promo_expires}}, {{promo_percent}} et
-- {{promo_months}} viennent de `mail_automation_enrollments.metadata`, que la
-- route d'opt-in renseigne. Le moteur d'envoi n'a pas eu à changer.
--
-- L'automatisation est créée INACTIVE. Elle ne partira qu'une fois relue et
-- activée depuis Administration → Automatisations.
--
-- Rejouable : `mail_templates.name` ne porte pas de contrainte d'unicité, donc
-- on supprime les gabarits de cette séquence avant de les réinsérer.

BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.gabarit_placebo(
  emoji text, titre text, sous_titre text, corps text
) RETURNS text AS $fn$
  SELECT '<!DOCTYPE html>' || chr(10) || '<html>' || chr(10)
    || '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' || chr(10)
    || '<body style="margin: 0; padding: 0; font-family: ''Inter'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Arial, sans-serif; background-color: #f3f4f6;">' || chr(10)
    || '  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding: 40px 20px;">' || chr(10)
    || '    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">' || chr(10)
    || '      <tr><td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 38px 40px 28px; border-radius: 12px 12px 0 0; text-align: center;">' || chr(10)
    || '        <div style="font-size: 42px; margin-bottom: 6px;">' || emoji || '</div>' || chr(10)
    || '        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">' || titre || '</h1>' || chr(10)
    || '        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">' || sous_titre || '</p>' || chr(10)
    || '      </td></tr>' || chr(10)
    || '      <tr><td style="padding: 40px;">' || chr(10)
    || corps || chr(10)
    || '        <p style="margin: 26px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">À très vite,<br><strong style="color: #1f2937;">L''équipe OsteoUpgrade × MyOsteoflow</strong></p>' || chr(10)
    || '      </td></tr>' || chr(10)
    || '      <tr><td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">' || chr(10)
    || '        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2026 OsteoUpgrade × MyOsteoflow. Tous droits réservés.</p>' || chr(10)
    || '      </td></tr>' || chr(10)
    || '    </table>' || chr(10)
    || '  </td></tr></table>' || chr(10)
    || '</body></html>'
$fn$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION pg_temp.para(t text) RETURNS text AS $fn$
  SELECT '<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">' || t || '</p>'
$fn$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION pg_temp.bouton(libelle text, url text) RETURNS text AS $fn$
  SELECT '<div style="text-align: center; margin: 0 0 28px;"><a href="' || url
      || '" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 15px;">'
      || libelle || '</a></div>'
$fn$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION pg_temp.bouton_clair(libelle text, url text) RETURNS text AS $fn$
  SELECT '<div style="text-align: center; margin: 0 0 24px;"><a href="' || url
      || '" style="display: inline-block; border: 2px solid #7c3aed; color: #7c3aed; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 15px;">'
      || libelle || '</a></div>'
$fn$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION pg_temp.encart(t text) RETURNS text AS $fn$
  SELECT '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 22px;"><tr><td style="padding: 14px 18px; background-color: #f5f3ff; border-radius: 8px; font-size: 14px; line-height: 1.6; color: #374151;">'
      || t || '</td></tr></table>'
$fn$ LANGUAGE sql;

-- Encart de remise, identique dans les cinq premiers emails : le lecteur doit
-- le reconnaitre d'un message a l'autre sans avoir a le relire.
CREATE OR REPLACE FUNCTION pg_temp.bloc_code() RETURNS text AS $fn$
  SELECT '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 22px;"><tr><td style="padding: 18px; background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; text-align: center;">'
      || '<p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">Votre code personnel, {{promo_percent}} % de remise pendant {{promo_months}} mois</p>'
      || '<p style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 2px; color: #7c3aed; font-family: monospace;">{{promo_code}}</p>'
      || '<p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">Valable jusqu&rsquo;au {{promo_expires}}. Il s&rsquo;applique tout seul au moment de l&rsquo;abonnement.</p>'
      || '</td></tr></table>'
$fn$ LANGUAGE sql;

DELETE FROM public.mail_templates WHERE name LIKE 'funnel-placebo-%';

INSERT INTO public.mail_templates (name, subject, description, html, text) VALUES
(
  'funnel-placebo-1-acces',
  'Vos 7 vidéos, et votre code de remise',
  'Funnel effet placebo : J+0, accès au contenu et code personnel',
  pg_temp.gabarit_placebo(
    '🎬',
    'Vos 7 vidéos sont débloquées',
    'Optimiser le cabinet, chapitre offert',
    pg_temp.para('Bonjour <strong>{{first_name}}</strong>,')
    || pg_temp.para('Tout est ouvert sur votre page : <strong>sept vidéos, vingt et une minutes en tout</strong>. Vous pouvez y revenir autant de fois que vous voulez.')
    || pg_temp.bouton('Ouvrir mes vidéos', 'https://www.osteo-upgrade.fr/f/effet-placebo')
    || pg_temp.encart('<strong>Si vous changez d’appareil.</strong> L’accès est lié à ce navigateur. Sur un autre téléphone ou un autre ordinateur, remettez simplement votre adresse dans le formulaire de la page : tout se rouvre immédiatement.')
    || pg_temp.bloc_code()
  ),
  E'Bonjour {{first_name}},\n\nTout est ouvert sur votre page : sept vidéos, vingt et une minutes en tout. Vous pouvez y revenir autant de fois que vous voulez.\n\nhttps://www.osteo-upgrade.fr/f/effet-placebo\n\nSi vous changez d’appareil : l’accès est lié à ce navigateur. Sur un autre téléphone ou un autre ordinateur, remettez simplement votre adresse dans le formulaire de la page.\n\nVotre code personnel : {{promo_code}}\n{{promo_percent}} % de remise pendant {{promo_months}} mois, valable jusqu’au {{promo_expires}}.\nIl s’applique tout seul au moment de l’abonnement.\n\nÀ très vite,\nL’équipe OsteoUpgrade × MyOsteoflow'
),
(
  'funnel-placebo-2-bonus',
  'Deux vidéos de plus vous attendent',
  'Funnel effet placebo : J+2, les deux leçons non annoncées',
  pg_temp.gabarit_placebo(
    '🎁',
    'Deux vidéos de plus',
    'Elles n’étaient pas annoncées',
    pg_temp.para('Bonjour <strong>{{first_name}}</strong>,')
    || pg_temp.para('La page vous promettait sept vidéos. Le chapitre en compte neuf. <strong>Salle d’attente</strong> et <strong>Odeurs et thérapeute</strong> sont désormais sur votre page, à la suite des autres.')
    || pg_temp.bouton('Voir les deux vidéos', 'https://www.osteo-upgrade.fr/f/effet-placebo')
    || pg_temp.encart('<strong>Si vous ne changez qu’une chose cette semaine.</strong> La lumière. Orientez la table pour que le patient puisse voir l’extérieur, et remplacez le fluorescent froid par une température de couleur chaude à neutre. En 1984, dans <em>Science</em>, Ulrich a montré que des patients dont la chambre donnait sur des arbres quittaient l’hôpital plus tôt après leur opération que ceux qui faisaient face à un mur. Votre cabinet n’est pas un service de chirurgie, mais le mécanisme ne change pas de nature en changeant de lieu.')
    || pg_temp.bloc_code()
  ),
  E'Bonjour {{first_name}},\n\nLa page vous promettait sept vidéos. Le chapitre en compte neuf. « Salle d’attente » et « Odeurs et thérapeute » sont désormais sur votre page, à la suite des autres.\n\nhttps://www.osteo-upgrade.fr/f/effet-placebo\n\nSi vous ne changez qu’une chose cette semaine : la lumière. Orientez la table pour que le patient puisse voir l’extérieur, et remplacez le fluorescent froid par une température de couleur chaude à neutre. En 1984, dans Science, Ulrich a montré que des patients dont la chambre donnait sur des arbres quittaient l’hôpital plus tôt après leur opération que ceux qui faisaient face à un mur.\n\nVotre code personnel : {{promo_code}}\n{{promo_percent}} % de remise pendant {{promo_months}} mois, valable jusqu’au {{promo_expires}}.\nIl s’applique tout seul au moment de l’abonnement.\n\nÀ très vite,\nL’équipe OsteoUpgrade × MyOsteoflow'
),
(
  'funnel-placebo-3-mecanisme',
  'Pourquoi ça marche, et pourquoi ce n’est pas un truc',
  'Funnel effet placebo : J+4, le mécanisme et l’offre OsteoUpgrade',
  pg_temp.gabarit_placebo(
    '🧠',
    'Ce n’est pas un truc',
    'C’est un mécanisme, et il se documente',
    pg_temp.para('Bonjour <strong>{{first_name}}</strong>,')
    || pg_temp.para('Ce que vous venez de voir porte sur l’environnement. C’est la couche visible, celle qu’on peut changer dès lundi.')
    || pg_temp.para('En dessous, il y a une pharmacologie. Système opioïde endogène, endocannabinoïdes, dopamine, modulation descendante de la douleur. C’est le premier chapitre de la formation, et c’est ce qui sépare appliquer une recette de savoir pourquoi elle fonctionne, donc de savoir la rattraper quand elle ne fonctionne pas.')
    || pg_temp.encart('<strong>Les six chapitres restants.</strong> Comprendre l’effet placebo en thérapie manuelle, les facteurs contextuels, l’alliance thérapeutique, optimiser les attentes, le toucher thérapeutique intentionnel, l’intégration pratique.')
    || pg_temp.para('L’abonnement OsteoUpgrade ouvre cette formation en entier, et les six autres du catalogue. <strong>29,99 &euro; par mois, 20,99 &euro; avec votre code pendant trois mois.</strong> Les sept premiers jours ne sont pas prélevés.')
    || pg_temp.bouton('Découvrir OsteoUpgrade', 'https://www.osteo-upgrade.fr/auth?funnel=effet-placebo&amp;plan=osteoupgrade_monthly')
    || pg_temp.bloc_code()
  ),
  E'Bonjour {{first_name}},\n\nCe que vous venez de voir porte sur l’environnement. C’est la couche visible.\n\nEn dessous, il y a une pharmacologie : système opioïde endogène, endocannabinoïdes, dopamine, modulation descendante de la douleur. C’est le premier chapitre de la formation, et c’est ce qui sépare appliquer une recette de savoir pourquoi elle fonctionne.\n\nLes six chapitres restants : comprendre l’effet placebo en thérapie manuelle, les facteurs contextuels, l’alliance thérapeutique, optimiser les attentes, le toucher thérapeutique intentionnel, l’intégration pratique.\n\nL’abonnement OsteoUpgrade ouvre cette formation en entier, et les six autres du catalogue. 29,99 EUR par mois, 20,99 EUR avec votre code pendant trois mois. Les sept premiers jours ne sont pas prélevés.\n\nhttps://www.osteo-upgrade.fr/auth?funnel=effet-placebo&plan=osteoupgrade_monthly\n\nVotre code personnel : {{promo_code}}\n{{promo_percent}} % de remise pendant {{promo_months}} mois, valable jusqu’au {{promo_expires}}.\nIl s’applique tout seul au moment de l’abonnement.\n\nÀ très vite,\nL’équipe OsteoUpgrade × MyOsteoflow'
),
(
  'funnel-placebo-4-premium',
  'L’autre pièce qui vous prend du temps',
  'Funnel effet placebo : J+5, l’offre Premium',
  pg_temp.gabarit_placebo(
    '🗂',
    'La salle de soin, puis le bureau',
    'Premium : la formation et le logiciel de cabinet',
    pg_temp.para('Bonjour <strong>{{first_name}}</strong>,')
    || pg_temp.para('Vous venez de passer quelques jours à repenser votre salle de soin. Il y a une autre pièce qui vous coûte du temps chaque semaine, et elle ne se range pas avec de la lumière chaude.')
    || pg_temp.encart('<strong>MyOsteoflow.</strong> Dossiers patients et consultations, prise de note par dictée vocale, facturation et comptabilité, objectifs et statistiques de cabinet.')
    || pg_temp.para('Séparément, ce sont deux abonnements à 29,99 &euro;. Ensemble, <strong>Premium est à 49,99 &euro; par mois, soit 34,99 &euro; avec votre code pendant trois mois.</strong> Une seule facture, et les sept premiers jours ne sont pas prélevés non plus.')
    || pg_temp.bouton('Découvrir Premium', 'https://www.osteo-upgrade.fr/auth?funnel=effet-placebo&amp;plan=premium_monthly')
    || pg_temp.bloc_code()
  ),
  E'Bonjour {{first_name}},\n\nVous venez de passer quelques jours à repenser votre salle de soin. Il y a une autre pièce qui vous coûte du temps chaque semaine, et elle ne se range pas avec de la lumière chaude.\n\nMyOsteoflow : dossiers patients et consultations, prise de note par dictée vocale, facturation et comptabilité, objectifs et statistiques de cabinet.\n\nSéparément, ce sont deux abonnements à 29,99 EUR. Ensemble, Premium est à 49,99 EUR par mois, soit 34,99 EUR avec votre code pendant trois mois.\n\nhttps://www.osteo-upgrade.fr/auth?funnel=effet-placebo&plan=premium_monthly\n\nVotre code personnel : {{promo_code}}\n{{promo_percent}} % de remise pendant {{promo_months}} mois, valable jusqu’au {{promo_expires}}.\nIl s’applique tout seul au moment de l’abonnement.\n\nÀ très vite,\nL’équipe OsteoUpgrade × MyOsteoflow'
),
(
  'funnel-placebo-5-dernier-jour',
  'Votre code expire demain',
  'Funnel effet placebo : J+6, rappel d’échéance',
  pg_temp.gabarit_placebo(
    '⏳',
    'Votre code expire demain',
    'Message court, c’est le dernier rappel',
    pg_temp.para('Bonjour <strong>{{first_name}}</strong>,')
    || pg_temp.para('Votre code cesse d’être valable le <strong>{{promo_expires}}</strong>. Il ne sera pas prolongé : ce serait injuste envers ceux qui ont décidé avant la date.')
    || pg_temp.bloc_code()
    || pg_temp.bouton('OsteoUpgrade, 20,99 &euro;', 'https://www.osteo-upgrade.fr/auth?funnel=effet-placebo&amp;plan=osteoupgrade_monthly')
    || pg_temp.bouton_clair('Premium, 34,99 &euro;', 'https://www.osteo-upgrade.fr/auth?funnel=effet-placebo&amp;plan=premium_monthly')
    || pg_temp.para('Et si vous laissez passer, ce n’est pas grave. La formation ne bouge pas, et vos vidéos restent accessibles.')
  ),
  E'Bonjour {{first_name}},\n\nVotre code cesse d’être valable le {{promo_expires}}. Il ne sera pas prolongé : ce serait injuste envers ceux qui ont décidé avant la date.\n\nVotre code personnel : {{promo_code}}\n{{promo_percent}} % de remise pendant {{promo_months}} mois, valable jusqu’au {{promo_expires}}.\nIl s’applique tout seul au moment de l’abonnement.\n\nOsteoUpgrade à 20,99 EUR : https://www.osteo-upgrade.fr/auth?funnel=effet-placebo&plan=osteoupgrade_monthly\nPremium à 34,99 EUR : https://www.osteo-upgrade.fr/auth?funnel=effet-placebo&plan=premium_monthly\n\nEt si vous laissez passer, ce n’est pas grave. La formation ne bouge pas, et vos vidéos restent accessibles.\n\nÀ très vite,\nL’équipe OsteoUpgrade × MyOsteoflow'
),
(
  'funnel-placebo-6-apres',
  'Je vous laisse tranquille',
  'Funnel effet placebo : J+8, après expiration, sans remise',
  pg_temp.gabarit_placebo(
    '📚',
    'La remise est passée',
    'Rien d’autre n’a changé',
    pg_temp.para('Bonjour <strong>{{first_name}}</strong>,')
    || pg_temp.para('Votre code a expiré, et c’est le dernier message que nous vous écrirons à ce sujet.')
    || pg_temp.para('Ce qui reste, en revanche, ne dépend d’aucune date : vos vidéos sont toujours sur votre page, et l’essai de sept jours ne s’est jamais périmé. Rien n’est prélevé pendant cette semaine, et la résiliation tient en un clic.')
    || pg_temp.bouton('Essayer OsteoUpgrade sept jours', 'https://www.osteo-upgrade.fr/auth?funnel=effet-placebo&amp;plan=osteoupgrade_monthly')
    || pg_temp.encart('Vous continuerez de recevoir nos messages sur la pratique, une à deux fois par mois. Le lien de désinscription est en bas de chacun d’eux, et il fonctionne immédiatement.')
  ),
  E'Bonjour {{first_name}},\n\nVotre code a expiré, et c’est le dernier message que nous vous écrirons à ce sujet.\n\nCe qui reste ne dépend d’aucune date : vos vidéos sont toujours sur votre page, et l’essai de sept jours ne s’est jamais périmé. Rien n’est prélevé pendant cette semaine, et la résiliation tient en un clic.\n\nhttps://www.osteo-upgrade.fr/auth?funnel=effet-placebo&plan=osteoupgrade_monthly\n\nVous continuerez de recevoir nos messages sur la pratique, une à deux fois par mois. Le lien de désinscription est en bas de chacun d’eux.\n\nÀ très vite,\nL’équipe OsteoUpgrade × MyOsteoflow'
);

-- ── L'automatisation ───────────────────────────────────────────────────────
-- `stop_on_subscribe` : quelqu'un qui s'abonne au deuxième jour ne doit pas
-- recevoir « votre code expire demain » le surlendemain.

INSERT INTO public.mail_automations (name, description, trigger_event, active, stop_on_subscribe)
SELECT
  'Funnel : Effet placebo (remise 7 jours)',
  'Séquence déclenchée par les inscriptions sur /f/effet-placebo. Six emails sur huit jours, autour du code de remise personnel.',
  'funnel:effet-placebo',
  false,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.mail_automations
  WHERE trigger_event = 'funnel:effet-placebo'
);

DELETE FROM public.mail_automation_steps
WHERE automation_id IN (
  SELECT id FROM public.mail_automations
  WHERE trigger_event = 'funnel:effet-placebo'
);

INSERT INTO public.mail_automation_steps (automation_id, step_order, wait_minutes, subject, template_slug)
SELECT a.id, e.step_order, e.wait_minutes, e.subject, e.template_slug
FROM public.mail_automations a
CROSS JOIN (VALUES
  (1,     0, 'Vos 7 vidéos, et votre code de remise', 'funnel-placebo-1-acces'),
  (2,  2880, 'Deux vidéos de plus vous attendent', 'funnel-placebo-2-bonus'),
  (3,  2880, 'Pourquoi ça marche, et pourquoi ce n’est pas un truc', 'funnel-placebo-3-mecanisme'),
  (4,  1440, 'L’autre pièce qui vous prend du temps', 'funnel-placebo-4-premium'),
  (5,  1440, 'Votre code expire demain', 'funnel-placebo-5-dernier-jour'),
  (6,  2880, 'Je vous laisse tranquille', 'funnel-placebo-6-apres')
) AS e(step_order, wait_minutes, subject, template_slug)
WHERE a.trigger_event = 'funnel:effet-placebo';

COMMIT;
