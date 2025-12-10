# Module Diagnostics - Testing 3D Amélioré

## Vue d'ensemble

Ce module enrichit le système Testing 3D en permettant aux administrateurs de créer des "dossiers de diagnostics" qui regroupent des pathologies avec :
- **Photo** : Image illustrant la pathologie
- **Signes cliniques** : Liste des signes cliniques évidents
- **Tests associés** : Tests orthopédiques pertinents pour ce diagnostic

## 🚀 Installation

### 1. Appliquer la migration SQL

Connectez-vous à votre dashboard Supabase et exécutez le script SQL suivant dans le SQL Editor :

```sql
-- Fichier : scripts/apply-pathology-diagnostics-migration.sql

-- 1. Ajouter les colonnes pour les signes cliniques et l'image
ALTER TABLE public.pathologies
ADD COLUMN IF NOT EXISTS clinical_signs TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Créer la table de liaison entre pathologies et tests (many-to-many)
CREATE TABLE IF NOT EXISTS public.pathology_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathology_id UUID NOT NULL REFERENCES public.pathologies(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.orthopedic_tests(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pathology_id, test_id)
);

-- 3. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pathology_tests_pathology_id ON public.pathology_tests(pathology_id);
CREATE INDEX IF NOT EXISTS idx_pathology_tests_test_id ON public.pathology_tests(test_id);

-- 4. Ajouter des commentaires pour documenter les tables
COMMENT ON TABLE public.pathology_tests IS 'Liaison many-to-many entre pathologies (diagnostics) et tests orthopédiques. Un test peut appartenir à plusieurs diagnostics.';
COMMENT ON COLUMN public.pathologies.clinical_signs IS 'Signes cliniques évidents de la pathologie';
COMMENT ON COLUMN public.pathologies.image_url IS 'URL de l''image stockée dans Vercel Blob';
```

### 2. Vérifier que la migration a réussi

```sql
-- Vérifier les colonnes ajoutées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pathologies';

-- Vérifier la table de liaison
SELECT COUNT(*) FROM pathology_tests;
```

## 📖 Guide d'utilisation

### Côté Admin

#### 1. Accéder à la gestion des diagnostics

1. Connectez-vous en tant qu'admin
2. Allez dans **Admin Dashboard**
3. Cliquez sur la carte **"📁 Diagnostics (Testing 3D)"**

#### 2. Créer un nouveau diagnostic

1. Cliquez sur **"Nouveau Diagnostic"**
2. Remplissez les informations :
   - **Nom** : Ex: "Hernie discale L5-S1"
   - **Région anatomique** : Sélectionner la région (ex: Lombaire)
   - **Description** : Description clinique de la pathologie
   - **Signes cliniques** : Liste des signes évidents (douleur, irradiation, etc.)
   - **Photo** : Uploader une image illustrant la pathologie

3. **Associer des tests** :
   - Les tests de la région sélectionnée apparaissent dans la liste
   - Cochez les tests pertinents pour ce diagnostic
   - Réorganisez l'ordre avec les boutons de déplacement
   - **Note** : Un test peut appartenir à plusieurs diagnostics

4. Cliquez sur **"Créer le diagnostic"**

#### 3. Modifier un diagnostic existant

1. Dans la liste des diagnostics, cliquez sur **"Modifier"** (icône crayon)
2. Modifiez les informations souhaitées
3. Ajoutez/retirez des tests
4. Cliquez sur **"Enregistrer les modifications"**

### Côté Praticien (Module Testing 3D)

#### Workflow de consultation

1. Le praticien accède au **Module Testing 3D** (`/testing`)
2. Il clique sur une **région anatomique** sur le modèle 3D
3. **Un modal s'ouvre automatiquement** avec :
   - La liste des diagnostics pour cette région
   - Chaque diagnostic affiche sa photo et un aperçu

4. **Sélectionner un diagnostic** :
   - Le praticien clique sur un diagnostic
   - Le modal affiche :
     - La photo du diagnostic
     - Les signes cliniques évidents
     - La liste des tests associés

5. **Ajouter les tests à la session** :
   - Cliquer sur **"Ajouter tous ces tests à la session"**
   - Tous les tests du diagnostic sont ajoutés automatiquement
   - Les tests déjà présents sont ignorés

6. **Évaluer les tests** :
   - Marquer chaque test comme Positif / Négatif / Incertain
   - Ajouter des notes si nécessaire
   - Générer le PDF de la session

## 🏗️ Architecture technique

### Nouvelles tables

#### `pathologies` (enrichie)
- `clinical_signs` TEXT : Signes cliniques évidents
- `image_url` TEXT : URL de l'image (Vercel Blob)

#### `pathology_tests` (nouvelle)
- `id` UUID : Identifiant unique
- `pathology_id` UUID : Référence vers la pathologie
- `test_id` UUID : Référence vers le test
- `order_index` INTEGER : Ordre d'affichage
- Contrainte UNIQUE sur (pathology_id, test_id)

### Nouvelles pages

#### Admin
- `/admin/diagnostics` : Liste des diagnostics
- `/admin/diagnostics/new` : Création d'un diagnostic
- `/admin/diagnostics/[id]/edit` : Édition d'un diagnostic

#### Composants
- `DiagnosticsModal.tsx` : Modal affiché aux praticiens

### API Routes
- `/api/pathology-image-upload` : Upload d'images vers Vercel Blob (existante)

## 🎨 Fonctionnalités

### Upload d'images
- Format acceptés : PNG, JPG, JPEG
- Taille max : 10 MB
- Stockage : Vercel Blob
- Affichage : Next.js Image avec optimisation

### Glisser-Déposer des tests
- Interface checkbox pour sélectionner les tests
- Boutons de réorganisation pour changer l'ordre
- Filtrage automatique par région
- Recherche par nom de test

### Modal intuitif
- Design responsive
- Photos en plein format
- Signes cliniques mis en évidence
- Navigation facile entre diagnostics

## 📊 Avantages

### Pour les administrateurs
- ✅ Interface simple et visuelle
- ✅ Upload facile d'images
- ✅ Organisation claire par région
- ✅ Réutilisation des tests (many-to-many)

### Pour les praticiens
- ✅ Accès rapide aux diagnostics par région
- ✅ Aide visuelle avec les photos
- ✅ Signes cliniques facilement consultables
- ✅ Ajout rapide de tous les tests d'un diagnostic
- ✅ Workflow fluide et intuitif

## 🔧 Maintenance

### Vérifier les diagnostics
```sql
-- Compter les diagnostics par région
SELECT region, COUNT(*) as nb_diagnostics
FROM pathologies
WHERE clinical_signs IS NOT NULL OR image_url IS NOT NULL
GROUP BY region;

-- Voir les tests associés à chaque diagnostic
SELECT
  p.name as pathology,
  p.region,
  COUNT(pt.test_id) as nb_tests
FROM pathologies p
LEFT JOIN pathology_tests pt ON p.id = pt.pathology_id
GROUP BY p.id, p.name, p.region
ORDER BY p.region, p.name;
```

### Nettoyer les diagnostics inactifs
```sql
-- Désactiver les diagnostics sans tests
UPDATE pathologies
SET is_active = false
WHERE id NOT IN (
  SELECT DISTINCT pathology_id FROM pathology_tests
);
```

## 🐛 Troubleshooting

### Les diagnostics n'apparaissent pas dans le modal
1. Vérifier que le diagnostic est **actif** (`is_active = true`)
2. Vérifier que la **région** correspond bien (ex: 'lombaire', pas 'Lombaire')
3. Vérifier dans Supabase :
   ```sql
   SELECT * FROM pathologies WHERE region = 'lombaire' AND is_active = true;
   ```

### L'upload d'image échoue
1. Vérifier la variable d'environnement `BLOB_READ_WRITE_TOKEN`
2. Vérifier que le fichier fait moins de 10 MB
3. Consulter les logs Vercel

### Les tests n'apparaissent pas dans la sélection
1. Vérifier que les tests ont une `category` qui correspond à la région
2. La correspondance se fait sur :
   - Égalité stricte : `test.category === region.label`
   - Inclusion : `region.label.includes(test.category)`

## 📝 Changelog

### Version 1.0 (2025-12-10)
- ✨ Création du module diagnostics
- ✨ Upload d'images via Vercel Blob
- ✨ Sélection multi-tests avec drag & drop
- ✨ Modal praticien avec navigation intuitive
- ✨ Intégration complète dans Testing 3D

## 🎯 Prochaines améliorations possibles

- [ ] Drag & drop réel pour réorganiser les tests
- [ ] Filtres avancés dans la sélection de tests
- [ ] Export CSV des diagnostics
- [ ] Duplication de diagnostics
- [ ] Historique des modifications
- [ ] Suggestions de diagnostics basées sur l'IA

---

**Auteur** : Claude Code
**Date** : 10 décembre 2025
**Version** : 1.0
