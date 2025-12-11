# Gamification System Migration

## 📋 Description

Cette migration met en place un système complet de gamification pour OsteoUpgrade incluant :

- ✅ **Système de niveaux et XP** : 1 niveau tous les 10 sessions
- 🏆 **Achievements** : 16 badges prédéfinis (débutant, expert, streaks, perfectionniste, etc.)
- 📊 **Statistiques automatiques** : Mise à jour en temps réel des stats utilisateur
- 🔥 **Séries (Streaks)** : Tracking des jours consécutifs d'activité
- 🎯 **Objectifs hebdomadaires** : Sessions, complétion, tests

## 🗂️ Tables créées

### 1. `achievements`
Définit tous les achievements disponibles dans le système.

**Colonnes principales :**
- `slug` : Identifiant unique (ex: 'first_steps')
- `name` : Nom affiché (ex: 'Premiers pas')
- `description` : Description (ex: 'Complétez votre première session')
- `icon` : Nom de l'icône Lucide (ex: 'Sparkles')
- `category` : Catégorie ('session', 'streak', 'completion', 'milestone', 'special')
- `unlock_condition` : Condition JSON (ex: `{"type": "session_count", "value": 1}`)
- `points` : Points XP attribués
- `gradient_from/to` : Classes Tailwind pour les gradients

### 2. `user_achievements`
Stocke les achievements débloqués par utilisateur.

**Colonnes principales :**
- `user_id` : Référence à l'utilisateur
- `achievement_id` : Référence à l'achievement
- `unlocked_at` : Date de déblocage
- `notified` : Si l'utilisateur a été notifié

### 3. `user_gamification_stats`
Stocke toutes les statistiques de gamification par utilisateur.

**Colonnes principales :**
- `level` : Niveau actuel
- `total_xp` : XP total
- `current_streak` : Série actuelle (jours consécutifs)
- `best_streak` : Meilleure série
- `total_sessions` : Total de sessions
- `total_tests` : Total de tests
- `week_sessions` : Sessions de la semaine
- `completion_rate` : Taux de complétion (%)

## 🔄 Fonctions et Triggers

### Fonctions

1. **`update_user_gamification_stats()`**
   - Recalcule automatiquement toutes les stats quand une session est créée/modifiée
   - Calcule le niveau, l'XP, les streaks, le taux de complétion
   - Mise à jour automatique via trigger

2. **`check_and_unlock_achievements()`**
   - Vérifie automatiquement les conditions d'achievement
   - Débloque les achievements quand les conditions sont remplies
   - Ajoute les points XP automatiquement

3. **`initialize_existing_users_gamification()`**
   - Fonction utilitaire pour initialiser les stats des utilisateurs existants
   - À exécuter manuellement après la migration si besoin

### Triggers

1. **`trigger_update_gamification_stats`**
   - Se déclenche sur INSERT/UPDATE/DELETE de `user_sessions`
   - Appelle `update_user_gamification_stats()`

2. **`trigger_check_achievements`**
   - Se déclenche sur INSERT/UPDATE de `user_gamification_stats`
   - Appelle `check_and_unlock_achievements()`

## 🚀 Installation

### Méthode 1 : Supabase CLI (Recommandée)

```bash
# Se connecter à votre projet Supabase
supabase link --project-ref <your-project-ref>

# Appliquer la migration
supabase db push

# Ou créer une nouvelle migration
supabase migration new gamification_system
# Copier le contenu de 20250112_gamification_system.sql
supabase db push
```

### Méthode 2 : Supabase Dashboard

1. Aller dans **SQL Editor** dans le dashboard Supabase
2. Copier le contenu de `20250112_gamification_system.sql`
3. Cliquer sur **Run** pour exécuter la migration

### Méthode 3 : psql

```bash
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/20250112_gamification_system.sql
```

## 🔧 Initialiser les utilisateurs existants

Si vous avez déjà des utilisateurs avec des sessions, exécutez cette fonction pour initialiser leurs stats :

```sql
SELECT public.initialize_existing_users_gamification();
```

Cette fonction va :
- Parcourir tous les utilisateurs ayant des sessions
- Calculer leurs stats (niveau, XP, streaks, etc.)
- Créer leur entrée dans `user_gamification_stats`
- Débloquer automatiquement les achievements qu'ils méritent

## 📊 Achievements prédéfinis

### Sessions
- 🌟 **Premiers pas** : 1 session (100 XP)
- 🎯 **Débutant** : 5 sessions (200 XP)
- 📈 **Intermédiaire** : 10 sessions (300 XP)
- 🏆 **Expert** : 20 sessions (500 XP)
- 👑 **Maître** : 50 sessions (1000 XP)
- 🥇 **Légende** : 100 sessions (2000 XP)

### Streaks
- 🔥 **En feu !** : 3 jours consécutifs (150 XP)
- ⚡ **Semaine parfaite** : 7 jours consécutifs (350 XP)
- 🔥 **Deux semaines !** : 14 jours consécutifs (700 XP)
- ⭐ **Un mois complet !** : 30 jours consécutifs (1500 XP)

### Complétion
- ⭐ **Perfectionniste** : 80% de complétion (400 XP)
- ✅ **Impeccable** : 95% de complétion (800 XP)

### Tests
- 🧪 **Explorateur** : 50 tests (300 XP)
- 📋 **Maître des tests** : 200 tests (1000 XP)

### Niveaux
- 📊 **Niveau 5** : Atteindre le niveau 5 (500 XP)
- 🏅 **Niveau 10** : Atteindre le niveau 10 (1000 XP)

## 🔐 Sécurité (RLS)

Les Row Level Security policies sont configurées pour :

- ✅ **Achievements** : Lecture publique, modification admin uniquement
- ✅ **User Achievements** : Chaque utilisateur voit uniquement ses achievements
- ✅ **User Stats** : Chaque utilisateur voit uniquement ses stats

## 🧪 Test

Après la migration, testez avec :

```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('achievements', 'user_achievements', 'user_gamification_stats');

-- Vérifier les achievements
SELECT slug, name, category FROM achievements ORDER BY display_order;

-- Vérifier les stats d'un utilisateur (remplacer <user_id>)
SELECT * FROM user_gamification_stats WHERE user_id = '<user_id>';

-- Vérifier les achievements d'un utilisateur
SELECT
  ua.unlocked_at,
  a.name,
  a.description,
  a.points
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '<user_id>'
ORDER BY ua.unlocked_at DESC;
```

## 📝 Notes

- Les stats sont mises à jour **automatiquement** via triggers
- Les achievements sont débloqués **automatiquement** quand les conditions sont remplies
- Le système est **rétroactif** : les utilisateurs existants obtiendront leurs achievements en exécutant la fonction d'initialisation
- Les points XP sont automatiquement ajoutés quand un achievement est débloqué
- Le niveau est calculé automatiquement : 1 niveau tous les 10 sessions

## 🐛 Troubleshooting

### Les stats ne se mettent pas à jour

```sql
-- Vérifier que les triggers existent
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Forcer la mise à jour pour un utilisateur
UPDATE user_sessions SET updated_at = NOW()
WHERE user_id = '<user_id>' LIMIT 1;
```

### Les achievements ne se débloquent pas

```sql
-- Vérifier les achievements actifs
SELECT slug, name, is_active FROM achievements WHERE is_active = true;

-- Forcer la vérification des achievements
UPDATE user_gamification_stats SET updated_at = NOW()
WHERE user_id = '<user_id>';
```

## 📚 Documentation

Pour plus d'informations, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Lucide Icons](https://lucide.dev/) (pour les icônes)
- Code du dashboard : `app/dashboard/page.tsx`
