import { supabase } from '../lib/supabase'

/**
 * Script pour créer les 6 automatisations d'emails avec leurs templates
 * Variables courtes utilisées :
 * - {{nom}} : nom du plan (Premium)
 * - {{prix}} : prix de l'abonnement (49,99€/mois)
 * - {{date_fact}} : date de prochaine facturation
 * - {{date_renouv}} : date de prochain renouvellement automatique
 * - {{cycle}} : numéro de renouvellement
 * - {{jours}} : jours avant le renouvellement
 */

interface AutomationData {
  name: string
  description: string
  trigger_event: string
  subject: string
  html: string
}

const automations: AutomationData[] = [
  // 1. Email de bienvenue à l'inscription
  {
    name: 'Bienvenue - Inscription',
    description: 'Email de bienvenue envoyé lors de la création du compte',
    trigger_event: 'Inscription',
    subject: 'Bienvenue sur OsteoUpgrade ! 🎉',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Bienvenue sur OsteoUpgrade !</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Merci d'avoir créé votre compte sur <strong>OsteoUpgrade</strong> ! Nous sommes ravis de vous accompagner dans le développement de votre pratique clinique.
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #8b5cf6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">Votre compte en un coup d'œil :</p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Email : <strong>{{email}}</strong></li>
                  <li style="margin-bottom: 8px;">Statut : <strong>Compte Gratuit</strong></li>
                  <li>Accès : <strong>Modules de base</strong></li>
                </ul>
              </div>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Vous pouvez dès maintenant explorer notre plateforme et découvrir nos outils cliniques gratuits.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Pour accéder à l'intégralité de nos contenus (Testing 3D, E-learning, Module pratique, Créateur de fiches...), <strong>passez à Premium</strong> dès aujourd'hui.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Découvrir Premium
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                À très vite,<br>
                <strong style="color: #1f2937;">L'équipe OsteoUpgrade</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2025 OsteoUpgrade. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },

  // 2. Confirmation Premium Silver
  {
    name: 'Confirmation - Premium Silver',
    description: 'Email de confirmation pour un abonnement Premium Silver',
    trigger_event: 'Passage à Premium Silver',
    subject: 'Bienvenue en Premium Silver ! 🚀',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Vous êtes maintenant Premium Silver !</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Votre abonnement <strong>Premium Silver</strong> est maintenant actif ! Vous avez désormais accès à tous les outils avancés d'OsteoUpgrade.
              </p>

              <div style="background-color: #eff6ff; border: 2px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1e40af;">📋 Récapitulatif de votre abonnement</p>
                <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                  <li style="margin-bottom: 8px;">Formule : <strong>{{nom}}</strong></li>
                  <li style="margin-bottom: 8px;">Prix : <strong>{{prix}}</strong></li>
                  <li style="margin-bottom: 8px;">Prochaine facturation : <strong>{{date_fact}}</strong></li>
                  <li>Renouvellement automatique — résiliable à tout moment avant cette date</li>
                </ul>
              </div>

              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #065f46;">✅ Sans engagement</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #064e3b;">
                  Votre abonnement se renouvelle automatiquement. Vous recevrez un rappel 7 jours avant chaque renouvellement. Vous pouvez annuler à tout moment depuis votre espace client.
                </p>
              </div>

              <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">Ce qui est maintenant accessible :</p>
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;">✅ <strong>Tests orthopédiques + export PDF</strong> : rapports automatiques</li>
                <li style="margin-bottom: 8px;">✅ <strong>E-learning actualisé</strong> : raisonnement clinique et protocoles</li>
                <li style="margin-bottom: 8px;">✅ <strong>Module pratique</strong> : techniques articulaires et mobilisations</li>
                <li style="margin-bottom: 8px;">✅ <strong>Créateur de fiches d'exercices</strong> pour vos patients</li>
                <li>✅ <strong>Topographies des pathologies</strong> détaillées</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/dashboard" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Commencer maintenant
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Bonne pratique,<br>
                <strong style="color: #1f2937;">L'équipe OsteoUpgrade</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                Des questions ? <a href="mailto:contact@osteo-upgrade.fr" style="color: #3b82f6; text-decoration: none;">Contactez-nous</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2025 OsteoUpgrade. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },

  // 3. Confirmation Premium Gold
  {
    name: 'Confirmation - Premium Gold',
    description: 'Email de confirmation pour un abonnement Premium Gold avec infos séminaire',
    trigger_event: 'Passage à Premium Gold',
    subject: 'Bienvenue en Premium Gold ! 👑',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">👑</div>
              <h1 style="margin: 0; color: #1f2937; font-size: 28px; font-weight: 700;">Bienvenue en Premium Gold !</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Félicitations ! Votre abonnement <strong>Premium Gold</strong> est actif. Vous faites désormais partie d'un groupe exclusif de praticiens engagés dans l'excellence clinique.
              </p>

              <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #92400e;">📋 Récapitulatif de votre abonnement</p>
                <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                  <li style="margin-bottom: 8px;">Formule : <strong>{{nom}}</strong></li>
                  <li style="margin-bottom: 8px;">Prix : <strong>{{prix}}</strong></li>
                  <li style="margin-bottom: 8px;">Prochaine facturation : <strong>{{date_fact}}</strong></li>
                  <li>Renouvellement automatique annuel — résiliable avant cette date</li>
                </ul>
              </div>

              <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #065f46;">✅ Sans engagement</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #064e3b;">
                  Votre abonnement se renouvelle automatiquement chaque année. Vous recevrez un rappel 7 jours avant chaque renouvellement. Vous pouvez annuler à tout moment depuis votre espace client.
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 25px; margin: 30px 0; border-radius: 12px;">
                <p style="margin: 0 0 15px; font-size: 18px; font-weight: 700; color: #92400e; text-align: center;">✨ L'exclusivité Gold ✨</p>
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #78350f;">Séminaire présentiel annuel (2 jours)</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #78350f;">
                  En tant qu'abonné Gold, vous êtes invité à notre séminaire annuel exclusif : <strong>2 jours d'immersion</strong> avec l'équipe OsteoUpgrade, des échanges cliniques approfondis, des ateliers pratiques et un networking de qualité entre praticiens motivés.
                </p>
                <p style="margin: 15px 0 0; font-size: 13px; line-height: 1.5; color: #92400e;">
                  📅 Vous recevrez les détails (dates, lieu, programme) par email dans les prochaines semaines.
                </p>
              </div>

              <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">Tout le contenu Premium à votre disposition :</p>
              <ul style="margin: 0 0 20px; padding-left: 20px; color: #374151;">
                <li style="margin-bottom: 8px;">✅ Testing 3D avec export PDF</li>
                <li style="margin-bottom: 8px;">✅ E-learning actualisé en continu</li>
                <li style="margin-bottom: 8px;">✅ Module pratique complet</li>
                <li style="margin-bottom: 8px;">✅ Créateur de fiches d'exercices</li>
                <li>✅ Topographies des pathologies</li>
              </ul>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #1f2937; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                  Accéder à la plateforme
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Excellente pratique,<br>
                <strong style="color: #1f2937;">L'équipe OsteoUpgrade</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                Des questions ? <a href="mailto:contact@osteo-upgrade.fr" style="color: #f59e0b; text-decoration: none;">Contactez-nous</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2025 OsteoUpgrade. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },

  // 4. Rappel de renouvellement (7 jours avant)
  {
    name: 'Rappel - Renouvellement imminent',
    description: 'Notification 7 jours avant le renouvellement automatique',
    trigger_event: 'Renouvellement imminent',
    subject: 'Votre abonnement se renouvelle dans {{jours}} jours',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Votre renouvellement approche</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Votre abonnement <strong>{{nom}}</strong> se renouvelle automatiquement dans <strong>{{jours}} jours</strong>.
              </p>

              <div style="background-color: #eff6ff; border: 2px solid #3b82f6; padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #1e40af;">Date de renouvellement :</p>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1e3a8a;">{{date_renouv}}</p>
                <p style="margin: 15px 0 0; font-size: 14px; color: #3b82f6;">Dans <strong>{{jours}} jours</strong></p>
              </div>

              <div style="background-color: #f9fafb; border-left: 4px solid #6366f1; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">Que va-t-il se passer ?</p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">Votre abonnement <strong>{{nom}}</strong> ({{prix}}) se renouvellera automatiquement</li>
                  <li style="margin-bottom: 8px;">Votre prochain paiement aura lieu le <strong>{{date_renouv}}</strong></li>
                  <li>Vous pouvez annuler avant cette date si vous le souhaitez — aucun frais</li>
                </ul>
              </div>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Si vous souhaitez poursuivre avec OsteoUpgrade, <strong>aucune action n'est requise</strong>. Votre abonnement continuera automatiquement.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Si vous souhaitez annuler, rendez-vous dans votre espace abonnement avant le <strong>{{date_renouv}}</strong>.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Gérer mon abonnement
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Cordialement,<br>
                <strong style="color: #1f2937;">L'équipe OsteoUpgrade</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                Des questions ? <a href="mailto:contact@osteo-upgrade.fr" style="color: #3b82f6; text-decoration: none;">Contactez-nous</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2025 OsteoUpgrade. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },

  // 5. Confirmation de renouvellement
  {
    name: 'Confirmation - Renouvellement effectué',
    description: 'Confirmation après le renouvellement de l\'abonnement',
    trigger_event: 'Renouvellement effectué',
    subject: 'Votre abonnement a été renouvelé ✅',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Renouvellement confirmé !</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Votre abonnement <strong>{{nom}}</strong> a été renouvelé avec succès !
              </p>

              <div style="background-color: #d1fae5; border: 2px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #065f46;">📋 Détails du renouvellement</p>
                <ul style="margin: 0; padding-left: 20px; color: #047857;">
                  <li style="margin-bottom: 8px;">Formule : <strong>{{nom}}</strong></li>
                  <li style="margin-bottom: 8px;">Prix : <strong>{{prix}}</strong></li>
                  <li style="margin-bottom: 8px;">Prochaine facturation : <strong>{{date_fact}}</strong></li>
                  <li>Prochain renouvellement : <strong>{{date_renouv}}</strong></li>
                </ul>
              </div>

              <div style="background-color: #f9fafb; border-left: 4px solid #6366f1; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #1f2937;">💡 À savoir</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #4b5563;">
                  Votre abonnement se renouvellera automatiquement le <strong>{{date_renouv}}</strong>. Vous pouvez l'annuler à tout moment avant cette date depuis votre espace client, sans frais ni pénalité. Nous vous enverrons un rappel 7 jours avant.
                </p>
              </div>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Merci de continuer l'aventure avec nous ! Votre soutien nous permet de développer constamment de nouveaux contenus et outils pour améliorer votre pratique clinique.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accéder à la plateforme
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                À bientôt,<br>
                <strong style="color: #1f2937;">L'équipe OsteoUpgrade</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                Besoin d'aide ? <a href="mailto:contact@osteo-upgrade.fr" style="color: #10b981; text-decoration: none;">Nous contacter</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2025 OsteoUpgrade. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  },

  // 6. Notification d'expiration/annulation
  {
    name: 'Notification - Abonnement expiré',
    description: 'Email envoyé lors de l\'annulation ou expiration de l\'abonnement',
    trigger_event: 'Abonnement expiré',
    subject: 'Votre abonnement Premium a été annulé',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">👋</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Votre abonnement a été annulé</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">Bonjour <strong>{{full_name}}</strong>,</p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Nous vous confirmons que votre abonnement <strong>Premium</strong> a été annulé et n'est désormais plus actif.
              </p>

              <div style="background-color: #f3f4f6; border: 2px solid #9ca3af; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: 600; color: #1f2937;">Ce qui change pour vous :</p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">❌ Vous n'avez plus accès aux contenus Premium (Testing 3D, E-learning, Module pratique...)</li>
                  <li style="margin-bottom: 8px;">✅ Votre compte reste actif avec les fonctionnalités gratuites</li>
                  <li>✅ Vos données et historique sont conservés</li>
                </ul>
              </div>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #374151;">
                Nous espérons que votre expérience avec OsteoUpgrade vous a été utile dans votre pratique clinique.
              </p>

              <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #1e40af;">💙 Vous nous avez manqué ?</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1e3a8a;">
                  Vous pouvez réactiver votre abonnement Premium à tout moment depuis votre espace personnel. Tous vos contenus seront à nouveau accessibles instantanément.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.osteo-upgrade.fr/settings/subscription" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Réactiver Premium
                </a>
              </div>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Merci pour votre confiance,<br>
                <strong style="color: #1f2937;">L'équipe OsteoUpgrade</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af;">
                Une question ? <a href="mailto:contact@osteo-upgrade.fr" style="color: #6b7280; text-decoration: none;">Contactez-nous</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                © 2025 OsteoUpgrade. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }
]

async function createAutomations() {
  console.log('🚀 Création des automatisations d\'emails...\n')

  for (const automation of automations) {
    try {
      console.log(`📧 Création de "${automation.name}"...`)

      // Créer l'automatisation
      const { data: newAutomation, error: automationError } = await supabase
        .from('mail_automations')
        .insert({
          name: automation.name,
          description: automation.description,
          trigger_event: automation.trigger_event,
          active: true
        })
        .select()
        .single()

      if (automationError) {
        console.error(`   ❌ Erreur : ${automationError.message}`)
        continue
      }

      // Créer le template
      const { data: template, error: templateError } = await supabase
        .from('mail_templates')
        .insert({
          name: automation.name,
          subject: automation.subject,
          html: automation.html,
          text: automation.subject // Texte simple de fallback
        })
        .select()
        .single()

      if (templateError) {
        console.error(`   ❌ Erreur template : ${templateError.message}`)
        // Rollback : supprimer l'automatisation
        await supabase.from('mail_automations').delete().eq('id', newAutomation.id)
        continue
      }

      // Créer l'étape d'email
      const { error: stepError } = await supabase
        .from('mail_automation_steps')
        .insert({
          automation_id: newAutomation.id,
          step_order: 0,
          wait_minutes: 0, // Envoi immédiat
          subject: automation.subject,
          template_slug: template.id,
          payload: {} // Les variables seront injectées via metadata lors du trigger
        })

      if (stepError) {
        console.error(`   ❌ Erreur étape : ${stepError.message}`)
        // Rollback
        await supabase.from('mail_templates').delete().eq('id', template.id)
        await supabase.from('mail_automations').delete().eq('id', newAutomation.id)
        continue
      }

      console.log(`   ✅ Créée avec succès (ID: ${newAutomation.id})`)
    } catch (error: any) {
      console.error(`   ❌ Erreur inattendue : ${error.message}`)
    }
  }

  console.log('\n✅ Toutes les automatisations ont été créées !')
  console.log('\n📋 Variables courtes disponibles dans les templates :')
  console.log('   - {{nom}} : nom du plan (Premium)')
  console.log('   - {{prix}} : prix de l\'abonnement (49,99€/mois)')
  console.log('   - {{date_fact}} : date de prochaine facturation')
  console.log('   - {{date_renouv}} : date de prochain renouvellement automatique')
  console.log('   - {{cycle}} : numéro de renouvellement')
  console.log('   - {{jours}} : jours avant le renouvellement')
  console.log('   - {{full_name}} : nom complet de l\'utilisateur')
  console.log('   - {{email}} : email de l\'utilisateur')
}

// Exécuter le script
createAutomations()
  .then(() => {
    console.log('\n✅ Script terminé avec succès !')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale :', error)
    process.exit(1)
  })
