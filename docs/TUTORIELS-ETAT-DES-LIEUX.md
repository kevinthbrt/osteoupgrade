# Tutoriels MyOsteoflow : état des lieux

Inventaire des fonctions de MyOsteoflow (version 1.21, relu à partir de
l’application et de tout le changelog) et des tutoriels qui les expliquent.
Objectif : qu’un praticien trouve, pour chaque fonction, une vidéo d’une
minute et ses étapes en capture.

## Comment publier un tutoriel

1. Ajouter l’entrée dans `lib/tutorials.ts` (slug, rubrique, `addedAt`,
   étapes, questions fréquentes).
2. Déposer `public/tutoriels/videos/{slug}.mp4` et son affiche `.webp`, puis
   les captures `public/tutoriels/{slug}/etape-N.webp` (une par étape).
3. Déployer le site. La page publique `/tutoriels/{slug}` et le catalogue
   `/tutoriels/catalogue.json` se mettent à jour, et MyOsteoflow (1.22 et
   suivantes) l’affiche dans sa section « Tutoriels » sans nouvelle version,
   avec le badge « Nouveau » pendant 45 jours.

Tournage : cabinet de démonstration aux données fictives uniquement. Ce qui
dépend d’un service extérieur est simulé sur un cas inventé : test de
connexion email, transcription et structuration de la dictée, hypothèses,
rédaction des courriers, bibliothèque de tests `@ec`, envoi des relances. Les
réponses de suivi J+7, les relances passées et les techniques montrées sont
des données de démonstration retirées après le tournage, comme les conversations
de la messagerie, les patients importés et le cabinet créé pour la vidéo multi-cabinet.

## Déjà en ligne (28)

| Rubrique | Tutoriel | Ce qu’il couvre |
|---|---|---|
| Patients et suivi | `exercices` | Programme d’exercices par l’IA, appli patient, import du bilan |
| Agenda et Doctolib | `doctolib` | Extension Chrome, synchronisation, validation des patients, agenda de la semaine |
| Interface et raccourcis | `tableau-de-bord` | Organiser les blocs, météo |
| Interface et raccourcis | `onglets-et-recherche` | Onglets patients, Ctrl + K, bouton « Nouveau » |
| Consultation | `consultation` | Feuille unique, brouillon, plein écran, raccourcis |
| Prise en main | `premiers-pas` | Complétude du profil, coordonnées et mentions, facturation, tampon, types de séance, objectifs, verrouillage |
| Prise en main | `connexion-email` | Fournisseur, mot de passe d’application, test, synchronisation |
| Prise en main | `sauvegarde` | Bouton de l’en-tête, disque externe ou clé USB, rappel quotidien, restauration |
| Consultation | `dictee-anamnese` | Dictée, structuration en cartes, drapeaux rouges, informations détectées validées au dossier |
| Consultation | `aide-diagnostic` | Hypothèses classées, questions, tests positif ou négatif, saisie sur téléphone |
| Consultation | `finaliser-consultation` | Fenêtre de fin de séance : facture, envoi, conseils post-séance, suivi à J+7, relance |
| Agenda et Doctolib | `ma-journee` | Ajouter, réordonner (flèches), créer un patient, « Vu », jours suivants, bloc « Aujourd’hui » |
| Consultation | `examen-clinique` | Techniques dans Contenu clinique, `@ec` + région avec résultat, `@tech` + région |
| Patients et suivi | `courriers` | Patient et consultation, adressage, destinataire et consigne, relecture, PDF avec tampon |
| Patients et suivi | `relances` | Bloc de l’accueil, durée, recherche, relance unitaire ou groupée, programmées, déjà relancés |
| Patients et suivi | `suivi-j7` | Questionnaire J+7, cloche, indicateurs, réponses, « Traité », en attente, emails programmés |
| Gestion du cabinet | `ma-remuneration` | Ma situation, du chiffre d’affaires à la poche, cotisations et impôt, simulateur, objectif, charges |
| Prise en main | `importer-patients` | Import CSV (correspondance, aperçu), fiche Doctolib copiée-collée |
| Prise en main | `multi-cabinet` | Ajouter un cabinet, partage, basculer, supprimer un cabinet vide |
| Prise en main | `securite-rgpd` | Verrouillage automatique, mot de passe, cadenas, export et suppression RGPD |
| Patients et suivi | `dossier-patient` | Recherche, onglets, antécédents à date approximative, séance et facture en fenêtre, modification |
| Patients et suivi | `messagerie` | Conversations, réponse, pièces jointes et réponses rapides, nouveau message, envoi à tous |
| Gestion du cabinet | `recettes` | Chiffres clés, période, corrections, récapitulatif, exports et envoi au comptable |
| Gestion du cabinet | `objectifs` | Réalisé face à l’objectif, trajectoire, en patients, détail mensuel, paramétrage |
| Gestion du cabinet | `statistiques` | Filtres, chiffres clés, patients et canaux, consultations et motifs, revenus |
| Gestion du cabinet | `export-csv` | Période, données, colonnes, données de santé décochées, CSV pour Excel |
| Patients et suivi | `diffusion` | Email à tous les patients : compteur, filtre par date, bouton de rendez-vous, envoi étalé à 450 par jour, bandeau de suivi |
| Gestion du cabinet | `facturation` | Fin de séance, type et mode de paiement, envoi, dossier patient, « À traiter » |

## Manquants (1)

Les arbres décisionnels (lombalgie, cervicalgie) ne sont pas utilisés
aujourd’hui : pas de tutoriel prévu.

Priorité 1 : fonctions du quotidien ou du premier jour, sans lesquelles
l’application est mal utilisée. Priorité 2 : fonctions à forte valeur mais
moins fréquentes. Priorité 3 : compléments.

### Prise en main

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|

### Consultation

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|

### Patients et suivi

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|

### Agenda et Doctolib

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|

### Gestion du cabinet

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|

### Hors rubrique (offre OsteoUpgrade)

| Prio | Slug proposé | Tutoriel | À montrer |
|---|---|---|---|
| 3 | `elearning` | Se former depuis MyOsteoflow | E-Learning, progression, OsteoFlash et sa répétition espacée. Réservé aux formules qui incluent OsteoUpgrade |

## Ordre de production proposé

1. **Lot 1, le premier jour** : `premiers-pas`, `connexion-email`,
   `sauvegarde`, `facturation`. **En ligne.**
2. **Lot 2, la séance** : `dictee-anamnese`, `aide-diagnostic`,
   `finaliser-consultation`, `ma-journee`. **En ligne.**
3. **Lot 3, ce qui fait la différence** : `courriers`, `ma-remuneration`,
   `examen-clinique`, `relances`, `suivi-j7`. **En ligne.**
4. **Lot 4, le reste** : tous les tutoriels de priorité 2 et 3 restants. **En ligne**, sauf `elearning` : son contenu vient du serveur OsteoUpgrade et demande un compte avec formation, à tourner sur un vrai compte.

Le lot 1 étant en ligne, la visite guidée du premier démarrage peut
renvoyer vers `premiers-pas` plutôt que de tout expliquer elle-même.
