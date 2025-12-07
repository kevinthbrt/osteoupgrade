# Guide du système d'automatisation d'emails

## 🚀 Vue d'ensemble

Votre application dispose maintenant d'un système complet d'automatisation d'emails similaire à System.io ! Ce système permet de créer des séquences d'emails automatiques déclenchées par des événements spécifiques.

## 📋 Fonctionnalités

### 1. **Automatisations**
- Créez des séquences d'emails avec plusieurs étapes
- Définissez des délais entre chaque email (en jours)
- Activez/désactivez les automatisations
- Suivez les statistiques en temps réel

### 2. **Déclencheurs (Triggers)**
Les automatisations peuvent être déclenchées par :
- `contact_created` - Nouveau contact créé
- `contact_subscribed` - Contact abonné
- `tag_added` - Tag ajouté à un contact
- `subscription_started` - Abonnement démarré
- `subscription_ended` - Abonnement terminé
- `subscription_upgraded` - Abonnement upgradé
- `email_opened` - Email ouvert
- `email_clicked` - Lien cliqué
- `inactive_30_days` - Inactif depuis 30 jours
- `free_14_days` - Compte gratuit depuis 14 jours

### 3. **Templates dynamiques**
- Variables disponibles : `{{first_name}}`, `{{last_name}}`, `{{email}}`, `{{full_name}}`
- Support du HTML et du texte brut
- Éditeur visuel intégré

## 🛠️ Installation

### 1. Variables d'environnement

Ajoutez dans votre `.env.local` :

```env
# Email (déjà configuré)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM="OsteoUpgrade <no-reply@osteo-upgrade.fr>"

# Sécurité du cron (optionnel mais recommandé)
CRON_SECRET=your_random_secret_string
```

### 2. Configuration du Cron Job

#### Option A : Vercel (recommandé)

Le fichier `vercel.json` est déjà configuré pour exécuter le processeur toutes les 5 minutes :

```json
{
  "crons": [
    {
      "path": "/api/automations/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Important** : Les cron jobs Vercel nécessitent un plan Pro ou supérieur.

#### Option B : Service externe (Gratuit)

Utilisez un service comme [cron-job.org](https://cron-job.org) ou [Uptime Robot](https://uptimerobot.com) :

1. Créez un nouveau job
2. URL : `https://votre-domaine.com/api/automations/process`
3. Méthode : POST
4. Headers : `Authorization: Bearer YOUR_CRON_SECRET`
5. Fréquence : Toutes les 5 minutes

## 📖 Guide d'utilisation

### 1. Créer une automatisation

1. Allez sur `/admin/mailing`
2. Cliquez sur "Nouvelle automatisation"
3. Remplissez :
   - **Nom** : Ex. "Bienvenue nouveaux membres"
   - **Déclencheur** : Choisissez l'événement
   - **Audience** : Sélectionnez les destinataires
4. Ajoutez des étapes :
   - Sélectionnez un template
   - Définissez le délai (J+0, J+3, J+7, etc.)
5. Cliquez sur "Sauvegarder"
6. **Important** : Activez l'automatisation en cliquant sur "Activer"

### 2. Déclencher une automatisation manuellement

#### Via l'API :

```bash
curl -X POST https://votre-domaine.com/api/automations/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event": "contact_created",
    "contact_email": "nouveau@example.com"
  }'
```

#### Via le code :

```typescript
import { onContactCreated } from '@/lib/automation-triggers'

// Lors de la création d'un nouveau contact
await onContactCreated('nouveau@example.com', {
  source: 'landing_page'
})
```

### 3. Inscrire des contacts à une automatisation

```bash
curl -X POST https://votre-domaine.com/api/automations/{automationId}/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "contact_emails": ["user1@example.com", "user2@example.com"]
  }'
```

### 4. Suivre les automatisations

Visitez `/admin/automations` pour :
- Voir les statistiques en temps réel
- Consulter les inscriptions
- Suivre le statut de chaque contact
- Forcer le traitement manuellement

## 🔧 Intégrations

### Déclencher lors de l'inscription d'un utilisateur

Dans votre code d'inscription :

```typescript
// app/api/auth/signup/route.ts
import { onContactCreated } from '@/lib/automation-triggers'

export async function POST(request: Request) {
  // ... votre code d'inscription ...

  // Déclencher l'automatisation de bienvenue
  await onContactCreated(email, {
    first_name: firstName,
    last_name: lastName,
    signup_source: 'website'
  })

  return NextResponse.json({ success: true })
}
```

### Déclencher lors d'un upgrade d'abonnement

```typescript
import { onSubscriptionUpgraded } from '@/lib/automation-triggers'

// Lors du passage à Premium
await onSubscriptionUpgraded(contactId, 'premium_gold')
```

### Déclencher lors de l'ajout d'un tag

```typescript
import { onTagAdded } from '@/lib/automation-triggers'

// Lors de l'ajout d'un tag
await onTagAdded(contactId, 'webinar_attendee')
```

## 📊 Structure de la base de données

### Tables utilisées :

1. **mail_automations** - Les automatisations
2. **mail_automation_steps** - Les étapes de chaque automatisation
3. **mail_automation_enrollments** - Les inscriptions des contacts
4. **mail_contacts** - Les contacts
5. **mail_templates** - Les templates d'emails
6. **mail_events** - L'historique des événements

## 🎯 Exemples d'automatisations

### 1. Séquence de bienvenue

- **Déclencheur** : `contact_created`
- **Étape 1** (J+0) : Email de bienvenue
- **Étape 2** (J+3) : Présentation des fonctionnalités
- **Étape 3** (J+7) : Offre spéciale

### 2. Réactivation des inactifs

- **Déclencheur** : `inactive_30_days`
- **Étape 1** (J+0) : "On vous a manqué ?"
- **Étape 2** (J+3) : Nouveautés depuis leur absence
- **Étape 3** (J+7) : Offre de réactivation

### 3. Onboarding premium

- **Déclencheur** : `subscription_started`
- **Étape 1** (J+0) : Bienvenue Premium
- **Étape 2** (J+1) : Guide de démarrage
- **Étape 3** (J+7) : Conseils avancés

## 🔍 Monitoring

### Vérifier que tout fonctionne :

1. **Logs du processeur** :
   ```bash
   # Dans les logs Vercel ou votre serveur
   🚀 Starting automation processor...
   Found X active automation(s)
   ✅ Email sent to user@example.com for step 0
   ✅ Automation processing complete: X processed, X sent, 0 errors
   ```

2. **Tester manuellement** :
   - Visitez `/admin/automations`
   - Cliquez sur "Traiter maintenant"
   - Vérifiez les résultats

3. **Via l'API** :
   ```bash
   curl -X GET https://votre-domaine.com/api/automations/process
   ```

## ⚠️ Points importants

1. **Les automatisations doivent être ACTIVÉES** pour fonctionner
2. Le cron job doit être configuré pour que les emails soient envoyés
3. Les contacts doivent avoir le statut "subscribed"
4. Les templates utilisés doivent exister dans la base de données
5. Testez toujours avec un petit groupe avant un envoi massif

## 🐛 Dépannage

### Les emails ne sont pas envoyés ?

1. Vérifiez que l'automatisation est **active**
2. Vérifiez que le cron job s'exécute
3. Vérifiez les logs : `/api/automations/process`
4. Vérifiez que le contact a le statut "subscribed"
5. Vérifiez que le délai est écoulé

### Erreur "Unauthorized" sur le cron ?

Ajoutez le header d'autorisation :
```
Authorization: Bearer YOUR_CRON_SECRET
```

### Les contacts ne sont pas inscrits ?

1. Vérifiez que l'automatisation est active
2. Vérifiez que le trigger_event correspond
3. Vérifiez que le contact n'est pas déjà inscrit

## 🚀 Prochaines étapes

Améliorations possibles :
- [ ] Conditions IF/THEN dans les workflows
- [ ] A/B testing des emails
- [ ] Webhooks pour les événements externes
- [ ] Segmentation avancée
- [ ] Reporting et analytics détaillés
- [ ] Visual workflow builder (drag & drop)

## 📞 Support

Pour toute question, consultez :
- La documentation API dans chaque fichier
- Les commentaires dans le code
- Les logs de l'application

Bon emailing ! 🎉
