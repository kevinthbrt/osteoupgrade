# Guide d'Automatisation des Emails de Séminaires

## 📋 Vue d'ensemble

Ce système d'automatisation gère l'envoi automatique d'emails lors des événements suivants :

1. **Inscription à un séminaire** - Email de confirmation immédiat
2. **Désinscription d'un séminaire** - Email de confirmation d'annulation
3. **Rappel 1 mois avant** - Email de rappel 30 jours avant le début
4. **Rappel 1 semaine avant** - Email de rappel 7 jours avant le début
5. **Rappel la veille** - Email de rappel 1 jour avant le début

---

## 🗂️ Fichiers créés/modifiés

### Nouveaux fichiers :

1. **`supabase/migrations/20260109_seminar_automations.sql`**
   - Contient 5 templates d'emails (HTML + text)
   - Crée 5 automatisations avec leurs étapes
   - Définit 3 fonctions PostgreSQL pour l'enrôlement automatique
   - Crée 3 triggers sur la table `seminar_registrations`

2. **`app/api/automations/seminar-reminders/route.ts`**
   - Endpoint cron pour les rappels temporels
   - Vérifie quotidiennement les séminaires à venir
   - Envoie les rappels appropriés (1 mois, 1 semaine, 1 jour)

### Fichiers modifiés :

3. **`lib/automation-triggers.ts`**
   - Ajout de 5 nouveaux événements dans le type `TriggerEvent`
   - Ajout de 3 fonctions helper pour les événements de séminaires

---

## 🚀 Déploiement

### Étape 1 : Appliquer la migration SQL

```bash
# Se connecter à la base de données Supabase et exécuter :
psql -f supabase/migrations/20260109_seminar_automations.sql

# OU via Supabase Dashboard :
# 1. Aller dans SQL Editor
# 2. Copier/coller le contenu du fichier 20260109_seminar_automations.sql
# 3. Exécuter
```

### Étape 2 : Déployer le code

```bash
# Commit et push des changements
git add .
git commit -m "feat: Add seminar email automation system"
git push

# Le déploiement sur Vercel se fera automatiquement
```

### Étape 3 : Configurer le cron job Vercel

Ajouter dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/automations/process",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/automations/daily-checks",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/automations/seminar-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Important :** Le nouveau cron `/api/automations/seminar-reminders` s'exécutera tous les jours à 8h du matin.

---

## ⚙️ Fonctionnement

### 1. Inscription à un séminaire

**Trigger :** Quand un enregistrement est ajouté dans `seminar_registrations`

**Flow :**
```
Insertion dans seminar_registrations
    ↓
Trigger SQL: trigger_seminar_registration_created
    ↓
Fonction: enroll_user_in_seminar_automation()
    ↓
Récupère les infos utilisateur + séminaire
    ↓
Crée/met à jour le contact dans mail_contacts
    ↓
Enrôle le contact dans l'automatisation "Inscription séminaire"
    ↓
Le cron /api/automations/process envoie l'email
```

### 2. Désinscription d'un séminaire

**Trigger :** Quand un enregistrement est supprimé de `seminar_registrations`

**Flow :**
```
Suppression dans seminar_registrations
    ↓
Trigger SQL: trigger_cancel_seminar_reminders (BEFORE DELETE)
    ↓
Fonction: cancel_seminar_reminder_enrollments()
    ↓
Annule tous les enrollments de rappels en attente
    ↓
Trigger SQL: trigger_seminar_registration_cancelled (AFTER DELETE)
    ↓
Fonction: enroll_user_in_seminar_cancellation_automation()
    ↓
Enrôle dans l'automatisation "Désinscription séminaire"
    ↓
Le cron /api/automations/process envoie l'email
```

### 3. Rappels temporels (1 mois, 1 semaine, 1 jour)

**Trigger :** Cron quotidien à 8h du matin

**Flow :**
```
Cron job: /api/automations/seminar-reminders
    ↓
Vérifie les séminaires dans 30 jours
Vérifie les séminaires dans 7 jours
Vérifie les séminaires dans 1 jour
    ↓
Pour chaque séminaire trouvé:
    ↓
Récupère tous les utilisateurs inscrits
    ↓
Pour chaque utilisateur:
    ↓
Appelle /api/automations/trigger avec l'événement approprié
    ↓
Enrôle dans l'automatisation de rappel
    ↓
Le cron /api/automations/process envoie l'email
```

---

## 📧 Templates d'emails

Tous les templates utilisent des variables dynamiques :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{user_name}}` | Nom complet de l'utilisateur | "Jean Dupont" |
| `{{seminar_title}}` | Titre du séminaire | "Formation Cervicale Avancée" |
| `{{seminar_location}}` | Lieu du séminaire | "Paris, France" |
| `{{seminar_start_date}}` | Date de début formatée | "lundi 15 janvier 2026" |
| `{{seminar_end_date}}` | Date de fin formatée | "vendredi 19 janvier 2026" |
| `{{seminar_facilitator}}` | Nom du formateur | "Dr. Martin" |
| `{{seminar_theme}}` | Thème du séminaire | "Techniques avancées" |

---

## 🧪 Tests

### Tester manuellement les rappels

```bash
# Via curl
curl -X POST https://votre-domaine.com/api/automations/seminar-reminders

# Ou via navigateur (GET activé pour tests)
https://votre-domaine.com/api/automations/seminar-reminders
```

### Tester l'inscription/désinscription

```sql
-- Tester l'inscription
INSERT INTO seminar_registrations (user_id, seminar_id)
VALUES (
  'uuid-utilisateur',
  'uuid-seminaire'
);

-- Vérifier l'enrollment
SELECT * FROM mail_automation_enrollments
WHERE metadata->>'seminar_id' = 'uuid-seminaire'
ORDER BY created_at DESC;

-- Tester la désinscription
DELETE FROM seminar_registrations
WHERE user_id = 'uuid-utilisateur' AND seminar_id = 'uuid-seminaire';

-- Vérifier l'annulation des rappels
SELECT * FROM mail_automation_enrollments
WHERE metadata->>'seminar_id' = 'uuid-seminaire'
AND status = 'cancelled';
```

### Vérifier l'envoi des emails

```sql
-- Voir tous les événements d'emails de séminaires
SELECT
  me.event_type,
  me.created_at,
  mc.email,
  me.metadata->>'seminar_title' as seminar,
  me.metadata->>'reminder_type' as reminder_type
FROM mail_events me
JOIN mail_contacts mc ON me.contact_id = mc.id
WHERE me.automation_id IN (
  SELECT id FROM mail_automations
  WHERE trigger_event LIKE 'seminar_%'
)
ORDER BY me.created_at DESC;
```

---

## 🔧 Déclencheurs PostgreSQL créés

### 1. `trigger_seminar_registration_created`

- **Table :** `seminar_registrations`
- **Timing :** AFTER INSERT
- **Fonction :** `enroll_user_in_seminar_automation()`
- **Action :** Enrôle l'utilisateur dans l'automatisation de confirmation

### 2. `trigger_cancel_seminar_reminders`

- **Table :** `seminar_registrations`
- **Timing :** BEFORE DELETE
- **Fonction :** `cancel_seminar_reminder_enrollments()`
- **Action :** Annule tous les rappels en attente pour ce séminaire

### 3. `trigger_seminar_registration_cancelled`

- **Table :** `seminar_registrations`
- **Timing :** AFTER DELETE
- **Fonction :** `enroll_user_in_seminar_cancellation_automation()`
- **Action :** Enrôle l'utilisateur dans l'automatisation d'annulation

---

## 📊 Monitoring

### Voir les automatisations actives

```sql
SELECT
  name,
  trigger_event,
  active,
  (SELECT COUNT(*) FROM mail_automation_enrollments WHERE automation_id = ma.id) as total_enrollments,
  (SELECT COUNT(*) FROM mail_automation_enrollments WHERE automation_id = ma.id AND status = 'pending') as pending,
  (SELECT COUNT(*) FROM mail_automation_enrollments WHERE automation_id = ma.id AND status = 'completed') as completed
FROM mail_automations ma
WHERE trigger_event LIKE 'seminar_%'
ORDER BY created_at;
```

### Voir les prochains rappels à envoyer

```sql
SELECT
  s.title,
  s.start_date,
  COUNT(sr.id) as registrations,
  CASE
    WHEN s.start_date = CURRENT_DATE + INTERVAL '30 days' THEN '1 mois'
    WHEN s.start_date = CURRENT_DATE + INTERVAL '7 days' THEN '1 semaine'
    WHEN s.start_date = CURRENT_DATE + INTERVAL '1 day' THEN '1 jour'
  END as reminder_type
FROM seminars s
LEFT JOIN seminar_registrations sr ON s.id = sr.seminar_id
WHERE s.start_date IN (
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '1 day'
)
GROUP BY s.id, s.title, s.start_date
ORDER BY s.start_date;
```

---

## 🐛 Troubleshooting

### Les emails ne sont pas envoyés

1. **Vérifier que les automatisations sont actives :**
   ```sql
   SELECT * FROM mail_automations WHERE trigger_event LIKE 'seminar_%';
   ```

2. **Vérifier les enrollments :**
   ```sql
   SELECT * FROM mail_automation_enrollments WHERE status = 'pending' LIMIT 10;
   ```

3. **Vérifier les logs du cron :**
   - Aller dans Vercel Dashboard → Logs
   - Filtrer par `/api/automations/process` et `/api/automations/seminar-reminders`

### Les rappels ne sont pas créés

1. **Vérifier que le cron s'exécute :**
   ```bash
   curl https://votre-domaine.com/api/automations/seminar-reminders
   ```

2. **Vérifier les séminaires à venir :**
   ```sql
   SELECT * FROM seminars WHERE start_date > CURRENT_DATE ORDER BY start_date;
   ```

3. **Vérifier les inscriptions :**
   ```sql
   SELECT * FROM seminar_registrations WHERE seminar_id = 'uuid-seminaire';
   ```

### Les triggers ne fonctionnent pas

1. **Vérifier que les triggers existent :**
   ```sql
   SELECT
     trigger_name,
     event_manipulation,
     event_object_table,
     action_timing
   FROM information_schema.triggers
   WHERE event_object_table = 'seminar_registrations';
   ```

2. **Vérifier les fonctions :**
   ```sql
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_name LIKE '%seminar%';
   ```

---

## 🎨 Personnalisation des emails

Pour modifier les templates d'emails :

```sql
-- Lister tous les templates
SELECT id, name, subject FROM mail_templates WHERE name LIKE 'seminar%';

-- Modifier un template
UPDATE mail_templates
SET
  html = '...nouveau HTML...',
  text = '...nouveau texte...',
  updated_at = now()
WHERE name = 'seminar-registration-confirmation';
```

---

## 📝 Variables disponibles dans les métadonnées

Chaque enrollment contient les métadonnées suivantes :

```json
{
  "user_id": "uuid",
  "user_name": "Nom de l'utilisateur",
  "seminar_id": "uuid",
  "seminar_title": "Titre du séminaire",
  "seminar_location": "Lieu",
  "seminar_start_date": "Date formatée",
  "seminar_end_date": "Date formatée",
  "seminar_facilitator": "Nom du formateur",
  "seminar_theme": "Thème",
  "reminder_type": "1_month|1_week|1_day" // Pour les rappels uniquement
}
```

---

## 🔐 Sécurité

- Toutes les fonctions PostgreSQL utilisent `SECURITY DEFINER`
- Les RLS (Row Level Security) sont déjà configurées sur les tables `mail_*`
- Les endpoints cron devraient être protégés par un secret Vercel (voir documentation Vercel Cron)

---

## 📈 Métriques

Pour suivre les performances :

```sql
-- Taux d'ouverture des emails de séminaires
SELECT
  ma.name,
  COUNT(DISTINCT me.id) as total_sent,
  COUNT(DISTINCT CASE WHEN me.event_type = 'opened' THEN me.id END) as opened,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN me.event_type = 'opened' THEN me.id END) / NULLIF(COUNT(DISTINCT me.id), 0), 2) as open_rate
FROM mail_events me
JOIN mail_automations ma ON me.automation_id = ma.id
WHERE ma.trigger_event LIKE 'seminar_%'
GROUP BY ma.name;
```

---

## ✅ Checklist de déploiement

- [ ] Appliquer la migration SQL `20260109_seminar_automations.sql`
- [ ] Vérifier que les 5 templates sont créés
- [ ] Vérifier que les 5 automatisations sont créées et actives
- [ ] Vérifier que les 3 triggers sont créés
- [ ] Déployer le code sur Vercel
- [ ] Configurer le cron job dans `vercel.json`
- [ ] Tester manuellement l'inscription à un séminaire
- [ ] Tester manuellement la désinscription d'un séminaire
- [ ] Tester manuellement l'endpoint `/api/automations/seminar-reminders`
- [ ] Vérifier les logs Vercel après 24h

---

## 📞 Support

En cas de problème, vérifier :
1. Les logs Vercel
2. Les tables `mail_events` et `mail_automation_enrollments`
3. Les triggers PostgreSQL
4. La configuration du cron Vercel

Pour des questions supplémentaires, consulter le fichier `AUTOMATION_GUIDE.md` pour plus de détails sur le système d'automatisation général.
