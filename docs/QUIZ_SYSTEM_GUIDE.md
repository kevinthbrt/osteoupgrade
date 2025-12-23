# Guide du système de Quiz E-learning

## 📋 Vue d'ensemble

Le système de quiz permet aux administrateurs d'ajouter des quiz interactifs après chaque vidéo de cours. Les utilisateurs doivent réussir le quiz à 100% (par défaut) pour débloquer la vidéo suivante.

## ✨ Fonctionnalités principales

### Pour les utilisateurs
- **Quiz interactifs** : Questions à choix unique, multiple ou vrai/faux
- **Progression bloquée** : La vidéo suivante se débloque uniquement après avoir réussi le quiz
- **Feedback immédiat** : Voir les bonnes/mauvaises réponses après avoir répondu
- **Explications** : Affichage optionnel d'explications pour chaque question
- **Score requis personnalisable** : Généralement 100% mais configurable par quiz
- **Tentatives illimitées** : Possibilité de refaire le quiz autant de fois que nécessaire

### Pour les administrateurs
- **Gestion complète** : Créer, modifier et supprimer des quiz
- **Questions multiples types** :
  - Choix unique (une seule bonne réponse)
  - Choix multiples (plusieurs bonnes réponses)
  - Vrai/Faux
- **Interface intuitive** : Éditeur visuel pour gérer les quiz
- **Validation automatique** : Vérification de la cohérence des quiz

## 🎯 Utilisation

### Pour les étudiants

1. **Accéder à un cours**
   - Allez dans "E-learning" > "Cours"
   - Sélectionnez une formation
   - Ouvrez un chapitre et une sous-partie

2. **Regarder la vidéo**
   - La vidéo se charge automatiquement
   - Regardez le contenu pédagogique

3. **Passer le quiz**
   - Si un quiz est présent, il apparaît sous la vidéo
   - Cliquez sur "Commencer le quiz"
   - Répondez à toutes les questions
   - Validez vos réponses

4. **Résultats**
   - ✅ **Réussi** : Score ≥ 100% → La vidéo suivante se débloque
   - ❌ **Échoué** : Score < 100% → Possibilité de refaire le quiz

### Pour les administrateurs

#### Créer un quiz

1. **Accéder au gestionnaire de quiz**
   - Allez dans "E-learning" > "Cours" (en tant qu'admin)
   - Ouvrez une formation et une sous-partie
   - Cliquez sur "Créer quiz" à droite de la sous-partie

2. **Configurer le quiz**
   ```
   - Titre : "Quiz de validation - Anatomie cervicale"
   - Description : "Testez vos connaissances sur l'anatomie cervicale"
   - Score requis : 100 (%)
   ```

3. **Ajouter des questions**
   - Cliquez sur "Ajouter une question"
   - Entrez le texte de la question
   - Choisissez le type :
     - **Choix unique** : Une seule bonne réponse (radio button)
     - **Choix multiples** : Plusieurs bonnes réponses (checkbox)
     - **Vrai/Faux** : Question binaire
   - Définissez les points (généralement 1)

4. **Ajouter des réponses**
   - Ajoutez au moins 2 réponses
   - Cliquez sur le cercle vert pour marquer les bonnes réponses
   - Pour choix unique : Une seule réponse peut être correcte
   - Pour choix multiples : Plusieurs réponses peuvent être correctes

5. **Ajouter une explication (optionnel)**
   - Ajoutez du contexte ou des explications
   - S'affiche après que l'utilisateur a répondu

6. **Enregistrer**
   - Cliquez sur "Enregistrer"
   - Le quiz est maintenant actif pour cette sous-partie

#### Modifier un quiz

1. Accédez à la sous-partie
2. Cliquez sur "Modifier quiz"
3. Modifiez les questions, réponses, ou paramètres
4. Enregistrez les modifications

#### Supprimer un quiz

1. Accédez au gestionnaire de quiz
2. Cliquez sur "Supprimer le quiz" en bas à gauche
3. Confirmez la suppression

## 🗄️ Structure de la base de données

### Tables principales

```sql
-- Quiz associés aux sous-parties
elearning_quizzes
  - id
  - subpart_id (FK → elearning_subparts)
  - title
  - description
  - passing_score (défaut: 100)
  - is_active

-- Questions du quiz
elearning_quiz_questions
  - id
  - quiz_id (FK → elearning_quizzes)
  - question_text
  - question_type (multiple_choice | true_false | multiple_answer)
  - points
  - order_index
  - explanation

-- Réponses possibles
elearning_quiz_answers
  - id
  - question_id (FK → elearning_quiz_questions)
  - answer_text
  - is_correct
  - order_index

-- Tentatives des utilisateurs
elearning_quiz_attempts
  - id
  - quiz_id (FK → elearning_quizzes)
  - user_id (FK → auth.users)
  - score (0-100)
  - total_questions
  - correct_answers
  - passed (boolean)
  - answers_data (jsonb)
  - completed_at
```

## 🎨 Design et UX

### Modernisations apportées

1. **Interface vidéo améliorée**
   - Bordure arrondie (rounded-xl)
   - Bordure accentuée (border-2)
   - Ombre portée (shadow-lg)

2. **Quiz cards**
   - Gradient bleu (from-blue-50 to-indigo-50)
   - Bordure bleue (border-2 border-blue-200)
   - Icônes modernes (ClipboardCheck, Trophy)

3. **Badges de statut**
   - "Quiz validé" : Vert avec icône Trophy
   - "Quiz requis" : Bleu avec icône ClipboardCheck

4. **Verrous de progression**
   - Icône Lock pour les vidéos bloquées
   - Message d'alerte orange
   - Désactivation visuelle

5. **Modal de résultats**
   - Animation d'entrée (zoom-in)
   - Gradient de fond selon succès/échec
   - Barre de progression animée
   - Boutons d'action clairs

## 🔐 Sécurité (RLS)

Les politiques Row Level Security sont configurées :

- **Quiz, Questions, Réponses** :
  - Lecture : Tous les utilisateurs premium
  - Création/Modification/Suppression : Admins uniquement

- **Tentatives** :
  - Création : Utilisateur peut créer ses propres tentatives
  - Lecture : Utilisateur voit uniquement ses tentatives
  - Admins : Accès complet

## 📊 Analytics (Futur)

Possibilités d'extension :

- Statistiques de réussite par quiz
- Temps moyen de complétion
- Questions les plus difficiles
- Progression globale des utilisateurs
- Export des résultats

## 🚀 Migration

Pour appliquer le système de quiz à votre base de données :

```bash
# La migration se trouve dans :
supabase/migrations/20231223_add_quiz_system.sql

# Si vous utilisez Supabase CLI :
supabase db push

# Ou appliquez manuellement via le dashboard Supabase
```

## 💡 Bonnes pratiques

### Pour créer de bons quiz

1. **Questions claires et précises**
   - Évitez les ambiguïtés
   - Une seule notion par question

2. **Réponses cohérentes**
   - Même niveau de détail
   - Pas de pièges évidents

3. **Explications utiles**
   - Ajoutez du contexte
   - Renforcez l'apprentissage

4. **Progression logique**
   - Adaptez la difficulté
   - Alignez avec le contenu vidéo

5. **Score requis adapté**
   - 100% pour validation importante
   - Moins si quiz formatif

## 🐛 Dépannage

### Le quiz ne s'affiche pas
- Vérifiez que le quiz est marqué `is_active = true`
- Vérifiez les permissions RLS
- Consultez la console navigateur pour les erreurs

### La vidéo suivante reste bloquée
- Vérifiez que le score requis est atteint
- Rechargez la page pour rafraîchir les données
- Vérifiez `elearning_quiz_attempts` dans la BDD

### Erreur lors de la sauvegarde
- Vérifiez que toutes les questions ont au moins 2 réponses
- Vérifiez qu'au moins une réponse est correcte par question
- Consultez les logs serveur

## 📝 Exemple de quiz complet

```javascript
{
  title: "Quiz - Anatomie Cervicale",
  description: "Validez vos connaissances sur l'anatomie de la région cervicale",
  passing_score: 100,
  questions: [
    {
      question_text: "Combien de vertèbres cervicales possède le corps humain ?",
      question_type: "multiple_choice",
      points: 1,
      explanation: "La colonne cervicale est composée de 7 vertèbres, numérotées C1 à C7.",
      answers: [
        { answer_text: "5", is_correct: false },
        { answer_text: "7", is_correct: true },
        { answer_text: "9", is_correct: false },
        { answer_text: "12", is_correct: false }
      ]
    },
    {
      question_text: "Quelles sont les fonctions principales de la colonne cervicale ? (plusieurs réponses)",
      question_type: "multiple_answer",
      points: 1,
      explanation: "La colonne cervicale soutient la tête, protège la moelle épinière et permet les mouvements du cou.",
      answers: [
        { answer_text: "Soutenir la tête", is_correct: true },
        { answer_text: "Protéger la moelle épinière", is_correct: true },
        { answer_text: "Permettre les mouvements du cou", is_correct: true },
        { answer_text: "Réguler la température corporelle", is_correct: false }
      ]
    }
  ]
}
```

## 🎓 Conclusion

Le système de quiz e-learning offre une expérience d'apprentissage interactive et progressive. Les utilisateurs sont guidés à travers le contenu avec des validations régulières, tandis que les administrateurs disposent d'outils puissants pour créer du contenu pédagogique de qualité.
