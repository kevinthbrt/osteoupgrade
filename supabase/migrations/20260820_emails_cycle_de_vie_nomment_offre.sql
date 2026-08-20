-- Emails de cycle de vie : nommer l'offre réelle, plus « Premium » en dur.
--
-- Quatre corps de templates supposaient encore l'offre unique. Le sujet et les
-- champs de fusion étaient corrects depuis la phase 4a-bis, mais le texte, lui,
-- annonçait « Premium » à un abonné MyOsteoFlow ou OsteoUpgrade — et l'email
-- d'essai annulé parlait de MyOsteoflow quel que soit l'essai souscrit.
--
-- `{{nom}}` est déjà transmis par le webhook pour chacun de ces événements, et
-- l'agent de traitement l'applique à toutes les étapes d'une séquence, pas
-- seulement à la première.

UPDATE mail_templates SET html = replace(
  html,
  'votre abonnement <strong>Premium</strong> a été annulé',
  'votre abonnement <strong>{{nom}}</strong> a été annulé'
) WHERE name = 'Notification - Abonnement expiré';

UPDATE mail_templates SET html = replace(
  html,
  '❌ Vous n''avez plus accès aux contenus Premium',
  '❌ Vous n''avez plus accès aux contenus de l''offre {{nom}}'
) WHERE name = 'Notification - Abonnement expiré';

UPDATE mail_templates SET html = replace(
  html,
  'Vous pouvez réactiver votre abonnement Premium à tout moment depuis votre espace personnel.',
  'Vous pouvez réactiver un abonnement à tout moment depuis votre espace personnel — nos trois offres y sont disponibles.'
) WHERE name = 'Notification - Abonnement expiré';

UPDATE mail_templates SET html = replace(html, 'Réactiver Premium', 'Réactiver mon abonnement')
  WHERE name = 'Notification - Abonnement expiré';

UPDATE mail_templates SET html = replace(
  html,
  ' s&apos;est terminé sans conversion en abonnement Premium. ',
  ' s&apos;est terminé sans conversion en abonnement payant. '
) WHERE name = 'Notification - Essai gratuit annulé';

UPDATE mail_templates SET html = replace(
  html,
  'Vous pouvez souscrire à l&apos;abonnement Premium à tout moment depuis votre espace personnel pour retrouver MyOsteoflow et débloquer tout OsteoUpgrade.',
  'Vous pouvez souscrire à tout moment depuis votre espace personnel — à l&apos;offre {{nom}} que vous testiez, ou à une autre.'
) WHERE name = 'Notification - Essai gratuit annulé';

UPDATE mail_templates SET html = replace(html, 'Découvrir Premium', 'Découvrir les offres')
  WHERE name = 'Notification - Essai gratuit annulé';

UPDATE mail_templates SET html = replace(
  html,
  'Le dernier paiement de votre abonnement <strong>Premium</strong> n''a pas pu être traité.',
  'Le dernier paiement de votre abonnement <strong>{{nom}}</strong> n''a pas pu être traité.'
) WHERE name = 'Paiement échoué';

-- Ce template est partagé par la séquence Premium et la séquence MyOsteoFlow :
-- « vous êtes passé Premium » est faux pour la seconde.
UPDATE mail_templates SET html = replace(
  html,
  'Il y a une semaine, vous êtes passé Premium — merci !',
  'Il y a une semaine, vous avez souscrit à l''offre {{nom}} — merci !'
) WHERE name = 'MyOsteoflow - Rappel téléchargement J+7';
