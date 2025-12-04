# Guide d'intégration System.io pour OsteoUpgrade

Ce guide vous explique comment configurer et utiliser l'intégration System.io dans votre application OsteoUpgrade.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration initiale](#configuration-initiale)
4. [Migration de la base de données](#migration-de-la-base-de-données)
5. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
6. [Fonctionnalités](#fonctionnalités)
7. [Utilisation](#utilisation)
8. [API Routes](#api-routes)
9. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

L'intégration System.io permet de :

- **Synchroniser les utilisateurs** : Tous les nouveaux utilisateurs sont automatiquement ajoutés à System.io pour le mailing
- **Gérer les formations** : Afficher et gérer les formations hébergées sur System.io
- **Gérer les abonnements** : Système à 4 niveaux (free, premium_silver, premium_gold, admin)
- **Restreindre l'accès** : Les séminaires présentiels sont réservés aux Premium Gold

### Nouveaux niveaux d'abonnement

| Niveau | Accès en ligne | Séminaires présentiels | Badge |
|--------|----------------|------------------------|-------|
| **Free** | ❌ Non | ❌ Non | Gratuit |
| **Premium Silver** | ✅ Oui (Topographie, Testing 3D, E-learning) | ❌ Non | Premium Silver |
| **Premium Gold** | ✅ Oui (Tout le contenu en ligne) | ✅ Oui (1 séminaire/an) | Premium Gold |
| **Admin** | ✅ Oui (Accès total) | ✅ Oui | Admin |

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir :

1. Un compte System.io actif
2. Une clé API System.io (disponible dans votre espace System.io)
3. Accès à votre base de données Supabase
4. Accès à votre dashboard Vercel pour les variables d'environnement

---

## 🚀 Configuration initiale

### 1. Migration de la base de données Supabase

Exécutez le fichier SQL `supabase-migration.sql` dans votre dashboard Supabase :

```bash
# Allez dans votre dashboard Supabase > SQL Editor
# Copiez et exécutez le contenu de supabase-migration.sql
```

Ce script va :
- ✅ Modifier la contrainte des rôles pour ajouter `premium_silver` et `premium_gold`
- ✅ Convertir les utilisateurs `premium` existants en `premium_silver`
- ✅ Créer les tables nécessaires pour System.io :
  - `systemio_courses` : Stocke les formations
  - `user_course_enrollments` : Suivi des inscriptions
  - `systemio_sync_logs` : Logs de synchronisation
- ✅ Ajouter les champs `systemio_contact_id` et `systemio_synced_at` dans `profiles`
- ✅ Créer les index et politiques RLS appropriés

### 2. Mise à jour des utilisateurs existants

**IMPORTANT** : Après la migration, tous les utilisateurs `premium` deviennent automatiquement `premium_silver`.

Si vous souhaitez promouvoir certains utilisateurs en `premium_gold` :

```sql
-- Dans le SQL Editor de Supabase
UPDATE public.profiles
SET role = 'premium_gold'
WHERE email IN ('user1@example.com', 'user2@example.com');
```

---

## 🔐 Configuration des variables d'environnement

### Sur Vercel

Ajoutez les variables d'environnement suivantes dans votre dashboard Vercel :

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet OsteoUpgrade
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez les variables suivantes :

```env
# System.io Configuration
SYSTEMIO_API_KEY=votre_cle_api_systemio
SYSTEMIO_API_URL=https://systeme.io/api/v1

# Supabase (déjà configuré normalement)
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

### Obtenir votre clé API System.io

1. Connectez-vous à [systeme.io](https://systeme.io)
2. Allez dans **Paramètres** > **API**
3. Créez une nouvelle clé API
4. Copiez la clé et collez-la dans `SYSTEMIO_API_KEY`

**⚠️ IMPORTANT** : Après avoir ajouté les variables, redéployez votre application sur Vercel.

---

## 🎨 Fonctionnalités

### 1. Synchronisation automatique des utilisateurs

Quand un nouvel utilisateur s'inscrit :
- ✅ Il est créé dans Supabase
- ✅ Il est automatiquement synchronisé avec System.io (en arrière-plan)
- ✅ Il reçoit les tags appropriés selon son rôle (`free`, `premium`, `silver`, `gold`, etc.)
- ✅ Son ID System.io est stocké dans `profiles.systemio_contact_id`

### 2. Page E-learning (`/elearning`)

La nouvelle page E-learning permet aux utilisateurs Premium de :
- 📚 Voir toutes les formations disponibles sur System.io
- 📝 S'inscrire aux formations
- 📊 Suivre leur progression
- 🔗 Accéder directement aux cours sur System.io

**Accès** : Premium Silver, Premium Gold, Admin

### 3. Restrictions des séminaires

Les séminaires présentiels (`/seminaires`) sont maintenant réservés **uniquement aux Premium Gold** :
- Premium Silver : Accès à tout le contenu en ligne, mais PAS aux séminaires
- Premium Gold : Accès complet (contenu en ligne + 1 séminaire/an)

---

## 💡 Utilisation

### Pour les administrateurs

#### Synchroniser les formations depuis System.io

Vous pouvez synchroniser manuellement les formations depuis System.io :

1. Allez dans la console développeur de votre navigateur (F12)
2. Exécutez la requête suivante :

```javascript
fetch('/api/systemio/sync-courses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
}).then(res => res.json()).then(console.log)
```

Ou créez un bouton dans une page admin pour faciliter cette tâche.

#### Ajouter manuellement une formation

Si vous voulez ajouter une formation manuellement dans Supabase :

```sql
INSERT INTO public.systemio_courses (
  systemio_course_id,
  title,
  description,
  course_url,
  thumbnail_url,
  is_active,
  display_order
) VALUES (
  'course_123',
  'Formation Épaule et Coude',
  'Apprenez les techniques avancées pour traiter les pathologies de l\'épaule',
  'https://systeme.io/courses/votre-formation',
  'https://votre-url-image.com/thumbnail.jpg',
  true,
  1
);
```

### Pour les utilisateurs

#### Accéder aux formations (Premium Silver/Gold)

1. Connectez-vous à votre compte
2. Allez dans **E-learning** depuis le menu
3. Parcourez les formations disponibles
4. Cliquez sur **S'inscrire** pour vous inscrire à une formation
5. Cliquez sur **Accéder à la formation** pour être redirigé vers System.io

#### S'inscrire à un séminaire (Premium Gold uniquement)

1. Connectez-vous à votre compte
2. Allez dans **Séminaires présentiels** depuis le menu
3. Consultez les séminaires disponibles
4. Cliquez sur **Réserver ma place**

**Note** : Vous êtes limité à 1 séminaire (2 jours) par cycle annuel.

---

## 🔌 API Routes

### POST `/api/systemio/sync-user`

Synchronise un utilisateur avec System.io.

**Authentification** : Requise

**Réponse** :
```json
{
  "message": "User synced successfully",
  "contact_id": "contact_abc123"
}
```

### GET `/api/systemio/sync-user`

Vérifie le statut de synchronisation d'un utilisateur.

**Authentification** : Requise

**Réponse** :
```json
{
  "synced": true,
  "contact_id": "contact_abc123",
  "synced_at": "2025-12-04T10:30:00Z"
}
```

### POST `/api/systemio/sync-courses`

Synchronise les formations depuis System.io (Admin uniquement).

**Authentification** : Requise (Admin)

**Réponse** :
```json
{
  "message": "Courses synced",
  "total": 5,
  "synced": 5,
  "errors": 0
}
```

### GET `/api/systemio/sync-courses`

Obtient le dernier log de synchronisation (Admin uniquement).

**Authentification** : Requise (Admin)

---

## 🔧 Dépannage

### Problème : Les utilisateurs ne sont pas synchronisés

1. Vérifiez que `SYSTEMIO_API_KEY` est correctement configurée dans Vercel
2. Vérifiez les logs dans Supabase :
   ```sql
   SELECT * FROM systemio_sync_logs
   ORDER BY created_at DESC
   LIMIT 10;
   ```
3. Assurez-vous que votre clé API System.io est valide et a les permissions nécessaires

### Problème : Les formations n'apparaissent pas

1. Vérifiez que vous avez exécuté la migration SQL
2. Vérifiez que vous êtes bien connecté avec un compte Premium
3. Essayez de synchroniser manuellement les formations avec `/api/systemio/sync-courses`

### Problème : Erreur "SYSTEMIO_API_KEY is not configured"

1. Assurez-vous d'avoir ajouté la variable dans Vercel
2. Redéployez votre application après avoir ajouté la variable
3. Attendez quelques minutes que le déploiement soit terminé

### Problème : Les anciens utilisateurs premium ne voient pas le bon rôle

Si vous avez des utilisateurs avec l'ancien rôle `premium` :

```sql
-- Convertir tous les premium en premium_silver
UPDATE public.profiles
SET role = 'premium_silver'
WHERE role = 'premium';

-- Ou promouvoir certains en premium_gold
UPDATE public.profiles
SET role = 'premium_gold'
WHERE email IN ('user@example.com');
```

---

## 📚 Ressources supplémentaires

- [Documentation System.io API](https://systeme.io/api/v1/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Vercel](https://vercel.com/docs)

---

## 🆘 Support

Si vous rencontrez des problèmes :

1. Consultez la section [Dépannage](#dépannage) ci-dessus
2. Vérifiez les logs dans Supabase (`systemio_sync_logs`)
3. Vérifiez les logs dans Vercel (Dashboard > Logs)
4. Contactez le support System.io si le problème est lié à leur API

---

## ✅ Checklist de déploiement

Avant de mettre en production, vérifiez que :

- [ ] Le script SQL a été exécuté dans Supabase
- [ ] Les variables d'environnement sont configurées dans Vercel
- [ ] L'application a été redéployée après ajout des variables
- [ ] Les utilisateurs existants ont été migrés (premium → premium_silver)
- [ ] Vous avez testé la synchronisation d'un nouvel utilisateur
- [ ] Vous avez testé l'accès à la page E-learning
- [ ] Vous avez testé les restrictions d'accès aux séminaires
- [ ] La clé API System.io est valide et fonctionnelle

---

**Dernière mise à jour** : 4 décembre 2025
