/**
 * EXEMPLES D'INTÉGRATION DES AUTOMATISATIONS
 *
 * Ce fichier contient des exemples de code pour intégrer les automatisations
 * dans différentes parties de votre application.
 *
 * ⚠️ Ce fichier est fourni à titre d'exemple uniquement.
 * Copiez le code nécessaire dans vos fichiers existants.
 */

import {
  onContactCreated,
  onTagAdded,
  onSubscriptionStarted,
  onSubscriptionEnded,
  onSubscriptionUpgraded,
  triggerAutomations
} from './automation-triggers'

// ============================================
// EXEMPLE 1 : Lors de l'inscription d'un utilisateur
// ============================================

export async function handleUserSignup(email: string, firstName?: string, lastName?: string) {
  // ... votre logique d'inscription existante ...

  // Déclencher l'automatisation de bienvenue
  await onContactCreated(email, {
    first_name: firstName,
    last_name: lastName,
    signup_date: new Date().toISOString(),
    source: 'website'
  })

  console.log(`✅ Automatisations déclenchées pour ${email}`)
}

// ============================================
// EXEMPLE 2 : Lors du passage à un abonnement premium
// ============================================

export async function handleSubscriptionUpgrade(userId: string, newPlan: string) {
  // ... votre logique de mise à jour d'abonnement ...

  // Récupérer l'email du contact depuis la base de données
  // const { data: contact } = await supabase
  //   .from('mail_contacts')
  //   .select('id')
  //   .eq('user_id', userId)
  //   .single()

  // Déclencher l'automatisation d'upgrade
  // if (contact) {
  //   await onSubscriptionUpgraded(contact.id, newPlan)
  // }

  console.log(`✅ Automatisations d'upgrade déclenchées pour le plan ${newPlan}`)
}

// ============================================
// EXEMPLE 3 : Lors de l'expiration d'un abonnement
// ============================================

export async function handleSubscriptionExpiry(userId: string) {
  // ... votre logique d'expiration ...

  // Récupérer le contact
  // const { data: contact } = await supabase
  //   .from('mail_contacts')
  //   .select('id')
  //   .eq('user_id', userId)
  //   .single()

  // Déclencher l'automatisation de fin d'abonnement
  // if (contact) {
  //   await onSubscriptionEnded(contact.id)
  // }

  console.log('✅ Automatisations de fin d\'abonnement déclenchées')
}

// ============================================
// EXEMPLE 4 : Lors de l'ajout d'un tag (segmentation)
// ============================================

export async function addTagToContact(contactId: string, tag: string) {
  // ... votre logique d'ajout de tag ...

  // Mettre à jour les tags dans la base de données
  // await supabase
  //   .from('mail_contacts')
  //   .update({ tags: supabase.sql`array_append(tags, ${tag})` })
  //   .eq('id', contactId)

  // Déclencher les automatisations liées à ce tag
  await onTagAdded(contactId, tag)

  console.log(`✅ Tag "${tag}" ajouté et automatisations déclenchées`)
}

// ============================================
// EXEMPLE 5 : Trigger personnalisé via webhook
// ============================================

export async function handleWebhook(eventType: string, data: any) {
  // Exemple : webhook depuis Stripe, Paddle, etc.

  switch (eventType) {
    case 'payment.success':
      await triggerAutomations('subscription_started', {
        contact_email: data.customer_email,
        subscription_type: data.plan_name
      })
      break

    case 'payment.failed':
      await triggerAutomations('subscription_ended', {
        contact_email: data.customer_email
      })
      break

    case 'customer.created':
      await onContactCreated(data.email, {
        first_name: data.first_name,
        last_name: data.last_name,
        source: 'stripe'
      })
      break

    default:
      console.log(`Événement webhook non géré : ${eventType}`)
  }
}

// ============================================
// EXEMPLE 6 : Détecter les utilisateurs inactifs (cron job)
// ============================================

export async function detectInactiveUsers() {
  // Exécuter ce code via un cron job quotidien

  // Récupérer les utilisateurs inactifs depuis 30 jours
  // const { data: inactiveUsers } = await supabase
  //   .from('profiles')
  //   .select('id, email, last_login_at')
  //   .lt('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Pour chaque utilisateur inactif
  // for (const user of inactiveUsers || []) {
  //   await triggerAutomations('inactive_30_days', {
  //     contact_email: user.email
  //   })
  // }

  console.log('✅ Détection des utilisateurs inactifs terminée')
}

// ============================================
// EXEMPLE 7 : Détecter les comptes free depuis 14 jours
// ============================================

export async function detectFreeTrialExpiring() {
  // Exécuter ce code via un cron job quotidien

  // Récupérer les comptes free depuis 14 jours
  // const { data: freeUsers } = await supabase
  //   .from('profiles')
  //   .select('id, email, created_at')
  //   .eq('role', 'free')
  //   .lt('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
  //   .gt('created_at', new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString())

  // Pour chaque utilisateur
  // for (const user of freeUsers || []) {
  //   await triggerAutomations('free_14_days', {
  //     contact_email: user.email
  //   })
  // }

  console.log('✅ Détection des comptes free terminée')
}

// ============================================
// EXEMPLE 8 : API Route pour déclencher manuellement
// ============================================

/*
// app/api/trigger-automation/route.ts

import { NextResponse } from 'next/server'
import { triggerAutomations } from '@/lib/automation-triggers'

export async function POST(request: Request) {
  try {
    const { event, email } = await request.json()

    const result = await triggerAutomations(event, {
      contact_email: email
    })

    return NextResponse.json({
      success: true,
      enrolled: result.enrolled,
      errors: result.errors
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
*/

// ============================================
// EXEMPLE 9 : Inscrire manuellement des contacts à une automatisation
// ============================================

export async function enrollContactsToAutomation(
  automationId: string,
  emails: string[]
) {
  try {
    const response = await fetch(`/api/automations/${automationId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_emails: emails
      })
    })

    const result = await response.json()
    console.log(`✅ ${result.enrolled_count} contacts inscrits`)

    return result
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    throw error
  }
}

// ============================================
// EXEMPLE 10 : Créer une automatisation par code
// ============================================

export async function createWelcomeAutomation() {
  try {
    const response = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bienvenue nouveaux membres',
        description: 'Séquence de bienvenue pour les nouveaux inscrits',
        trigger_event: 'contact_created',
        steps: [
          {
            step_order: 0,
            wait_minutes: 0, // Immédiat
            subject: 'Bienvenue sur OsteoUpgrade ! 🎉',
            template_slug: 'welcome-template-id',
            payload: {
              cta_url: 'https://osteoupgrade.app/onboarding'
            }
          },
          {
            step_order: 1,
            wait_minutes: 3 * 24 * 60, // 3 jours
            subject: 'Découvrez nos fonctionnalités',
            template_slug: 'features-template-id',
            payload: {}
          },
          {
            step_order: 2,
            wait_minutes: 7 * 24 * 60, // 7 jours
            subject: 'Offre spéciale pour vous',
            template_slug: 'offer-template-id',
            payload: {
              discount_code: 'WELCOME10'
            }
          }
        ]
      })
    })

    const { automation } = await response.json()
    console.log('✅ Automatisation créée:', automation.id)

    return automation
  } catch (error) {
    console.error('Erreur lors de la création:', error)
    throw error
  }
}
