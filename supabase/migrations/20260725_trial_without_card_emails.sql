-- Essai gratuit sans carte bancaire : mise à jour du contenu des emails.
--
-- L'email de confirmation d'essai annonçait un prélèvement automatique de
-- 49,99€ à l'échéance. Ce n'est plus vrai : sans carte enregistrée, Stripe
-- annule l'abonnement à la fin de l'essai et le compte redevient 'free'.
-- Laisser cette promesse serait à la fois faux et contre-productif (c'est
-- exactement la friction que la suppression de la carte vise à lever).
--
-- Remplacements ciblés (idempotents) : on ne réécrit pas le template entier
-- pour ne pas écraser d'éventuelles retouches faites depuis l'admin.

UPDATE mail_templates
SET
  html = replace(
    replace(
      html,
      '<li>Passé cette date, votre carte sera débitée de <strong>49,99€</strong> pour le premier mois d&apos;abonnement Premium, <strong>sauf annulation avant la fin de l&apos;essai</strong></li>',
      '<li>Passé cette date, l&apos;essai prend fin automatiquement — <strong>aucun prélèvement</strong>. Pour garder MyOsteoflow et débloquer tout OsteoUpgrade, il vous suffira de souscrire à l&apos;abonnement Premium (<strong>49,99€/mois, sans engagement</strong>)</li>'
    ),
    '<li style="margin-bottom: 8px;">Aucun prélèvement pendant l&apos;essai</li>',
    '<li style="margin-bottom: 8px;">Aucune carte bancaire, aucun prélèvement</li>'
  ),
  text = replace(
    text,
    'Passé cette date, 49,99€/mois sauf annulation.',
    'Passé cette date, l''essai prend fin automatiquement, sans aucun prélèvement.'
  ),
  updated_at = now()
WHERE name = 'Confirmation - Essai gratuit MyOsteoflow';

-- L'email de fin d'essai évoquait un possible refus du moyen de paiement.
-- Sans carte enregistrée, ce cas n'existe plus : l'essai se termine, point.
UPDATE mail_templates
SET
  html = replace(
    html,
    '<strong>Aucun prélèvement n&apos;a été effectué</strong> (ou votre moyen de paiement a été refusé lors de la tentative de premier prélèvement).',
    '<strong>Aucun prélèvement n&apos;a été effectué</strong> — l&apos;essai gratuit ne demande aucune carte bancaire.'
  ),
  updated_at = now()
WHERE name = 'Notification - Essai gratuit annulé';
