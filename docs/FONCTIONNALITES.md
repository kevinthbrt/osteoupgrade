# Fonctionnalités de MyOsteoflow

Inventaire établi le 4 novembre 2026 à partir du code de MyOsteoflow (version
1.20 et branche de refonte) et de son changelog. Il sert de référence pour la
landing page, les funnels et les emails : une fonctionnalité qui n’est pas
ici ne devrait pas être promise.

Les fonctionnalités sont rangées selon la journée du praticien, pas selon les
menus de l’application : c’est ainsi qu’on les vend.

## Légende

| Repère | Sens | Usage marketing |
|---|---|---|
| ⭐ | Argument phare | Section dédiée sur la landing, avec capture ou vidéo |
| ● | Attendu d’un logiciel de cabinet | Cité dans la liste complète |
| ◐ | Secondaire ou réservé à certains profils | Liste complète seulement |
| ✂ | Candidat au tri | Ne pas mettre en avant, voir « Proposition de tri » |
| [OU] | Inclus avec OsteoUpgrade | Le préciser à chaque mention |
| [Bêta] | Pas encore disponible pour tous | Ne pas promettre |

## Arborescence

```
MyOsteoflow
│
├── 1. Préparer sa journée
│   ├── ⭐ Ma journée : les patients du jour dans l’ordre de passage, cochés au fil de la journée
│   ├── ⭐ Tableau de bord « Aujourd’hui » : prochain patient, « Démarrer la séance » en un clic
│   ├── ● Colonne « À traiter » : factures impayées, suivis J+7 du jour, questionnaires reçus, messages
│   ├── ◐ Tableau de bord organisable : blocs déplaçables, largeur, blocs masqués
│   ├── ◐ Météo dans la ligne d’accueil
│   └── [Bêta] Import de l’agenda Doctolib en un clic (extension Chrome, données restées sur le poste)
│
├── 2. Mener la séance
│   ├── ⭐ Dictée de l’anamnèse : l’IA transcrit et structure pendant que vous soignez
│   │   ├── Détection des antécédents et des infos patient (métier, sport, médecin), à valider un par un
│   │   └── Reconnexion automatique en cas de coupure réseau
│   ├── ⭐ Aide au raisonnement clinique : hypothèses, questions complémentaires, tests suggérés
│   ├── ⭐ Tests orthopédiques à portée de clavier
│   │   ├── Mentions @ec<région> dans l’examen (ex. @ecgenou), résultats insérés en un clic
│   │   ├── Bibliothèque par région, clusters de tests       [OU]
│   │   └── Vos propres techniques avec @tech<région>
│   ├── ● Dossier patient complet : coordonnées, antécédents par type, historique, factures
│   ├── ◐ Arbres décisionnels lombalgie et cervicalgie, conseils exportables
│   ├── ◐ Topographie : 22 vues, 10 régions, descriptions cliniques   [OU]
│   ├── ● Pièces jointes (comptes rendus, radios, ordonnances)
│   ├── ● Brouillon enregistré en continu, retrouvé après une veille ou un verrouillage
│   ├── ◐ Mode séance : feuille épurée, plein écran, raccourcis clavier
│   └── ◐ Alerte anniversaire sur la fiche et en consultation
│
├── 3. Après la séance
│   ├── ⭐ Finalisation guidée : facture, envoi, conseils, suivi et relance en une seule fenêtre
│   ├── ● Factures PDF avec tampon, paiements multiples ou fractionnés, envoi par email
│   ├── ⭐ Email de conseils post-séance, choisis pour ce patient parmi une liste par situation
│   ├── ⭐ Programmes d’exercices
│   │   ├── Générés par IA, avec justification clinique (EBP)
│   │   ├── Fiche PDF patient et appli patient sur téléphone
│   │   └── Programmes à étapes, ajustés au suivi
│   ├── ⭐ Suivi J+7 automatique : questionnaire EVA, mobilité, satisfaction, analysé dans l’appli
│   ├── ● Relance à 3, 6 ou 12 mois proposée en fin de séance
│   └── ◐ Courriers rédigés par IA : adressage à un confrère, attestation
│
├── 4. Fidéliser ses patients
│   ├── ⭐ Relance des patients non revus depuis 1 mois à 1 an, en un clic ou en groupe
│   ├── ● Messagerie patients avec pièces jointes
│   ├── ◐ Diffusion à tous les patients (envoi par lots, reprise automatique le lendemain)
│   ├── ● Lien de prise de rendez-vous ajouté aux relances
│   └── ◐ Canaux d’acquisition : qui vous recommande (confrère, salle de sport, mutuelle…)
│
├── 5. Piloter son cabinet
│   ├── ⭐ Ma rémunération : ce que vous pouvez vous verser après cotisations, impôt et TVA
│   │   ├── Micro-BNC et déclaration contrôlée
│   │   ├── Simulateur « Et si mon activité changeait ? »
│   │   └── Madelin et PER : plafond et économie d’impôt réelle
│   ├── ● Comptabilité : recettes, charges, immobilisations et amortissements
│   ├── ◐ Frais de véhicule au barème kilométrique officiel
│   ├── ● Objectifs de chiffre d’affaires par jour, semaine, mois, sur les jours réellement travaillés
│   ├── ● Statistiques : patientèle, motifs (22 catégories détectées), chiffre d’affaires
│   ├── ● Export CSV à la carte pour le comptable
│   ├── ◐ Multi-cabinet avec partage sélectif des données
│   └── ◐ Québec : facturation en dollars, TPS et TVQ
│
├── 6. Continuer à se former                                   [OU]
│   ├── ⭐ E-learning OsteoUpgrade intégré, avec progression
│   ├── ◐ OsteoFlash : révision par flashcards à répétition espacée
│   ├── ◐ Revue de littérature mensuelle
│   └── ◐ Vidéo de pratique
│
├── 7. Travailler vite
│   ├── ⭐ Onglets patients : plusieurs dossiers et séances ouverts, Ctrl + Tab pour passer de l’un à l’autre
│   ├── ⭐ Palette Ctrl + K : un patient et son action en trois touches, depuis n’importe où
│   ├── ● Recherche par nom, téléphone, email, profession ou date de naissance
│   ├── ● Création rapide de patient, import par copier-coller depuis Doctolib
│   ├── ◐ Thème clair et sombre
│   └── ◐ Visite guidée, support intégré, nouveautés dans l’appli
│
└── 8. Garder la maîtrise de ses données
    ├── ⭐ Données sur votre ordinateur, pas sur un serveur
    ├── ● Code PIN, verrouillage automatique, verrouillage en un clic
    ├── ● Sauvegarde en un clic et rappel automatique
    ├── ● RGPD : export et suppression des données d’un patient, journal d’activité
    └── ● Import de patients depuis un fichier CSV
```

## Proposition de tri

À confirmer avec les chiffres d’usage réels : MyOsteoflow ne mesure pas
l’usage des fonctionnalités aujourd’hui. Un compteur anonyme par
fonctionnalité, sans donnée patient, permettrait de trancher.

**Code mort, à supprimer** (plus affiché nulle part dans l’application) :
- widget Anniversaires (`birthday-widget.tsx`) ; l’alerte sur la fiche
  patient, elle, reste ;
- widget Citation (`quote-widget.tsx`) ;
- widget Statut (`status-widget.tsx`) ;
- widget Météo séparé (`weather-widget.tsx`) ; la météo reste dans l’accueil.

**À rendre discret** (garder, ne plus mettre en avant) :
- météo, vidéo de pratique, progression : masqués par défaut du tableau de
  bord depuis la refonte ;
- arbres décisionnels : deux régions seulement, doublonnent en partie l’aide
  au raisonnement clinique ;
- diffusion à tous les patients : utile ponctuellement, risque de spam.

**À vérifier avant toute promesse** :
- « 200+ tests » sur la landing : le changelog parle de 116 tests dans la
  bibliothèque. Aligner le chiffre sur la base réelle ;
- « Suivi automatique 7 jours » : le délai est réglable par consultation, la
  formulation peut le dire (« J+7 ou à la date de votre choix ») ;
- « 100 % local » : vrai pour le dossier patient, mais les emails, l’IA et les
  questionnaires passent par des services en ligne. Préférer « vos dossiers
  restent sur votre ordinateur ».

## Proposition pour la landing

### Le constat

La page aligne beaucoup de fonctionnalités de même poids : le visiteur ne
retient rien. Les illustrations des « douleurs du quotidien » sont réussies,
mais elles ne montrent jamais le produit. Leur style imite de près celui
d’un studio d’animation connu : à éviter pour une marque, et la page paraît
générée par IA là où elle doit inspirer confiance.

### La structure proposée

1. **Promesse** : une phrase qui raconte la journée, par exemple « De
   l’arrivée du patient à la facture envoyée, sans ressaisie. » avec une
   courte vidéo du produit en boucle.
2. **Trois moments, trois démonstrations**, chacun avec une capture ou une
   vidéo du vrai écran :
   - *Pendant la séance* : dictée et structuration de l’anamnèse ;
   - *À la fin de la séance* : finalisation en une fenêtre (facture, conseils,
     suivi J+7, relance) ;
   - *En fin de mois* : « Ma rémunération », ce que vous pouvez vous verser.
3. **Ce qui fait gagner du temps chaque jour** : Ma journée, onglets patients,
   palette Ctrl + K, relances. Quatre cartes courtes.
4. **OsteoUpgrade intégré** : la formation au même endroit que le cabinet.
5. **Confiance** : données sur le poste, PIN, sauvegarde, RGPD.
6. **Toutes les fonctionnalités** : l’arborescence ci-dessus en accordéon
   repliable, générée à partir d’un seul fichier de données pour rester à
   jour avec ce document.
7. Tarifs, puis appel à l’action.

### Les visuels

Captures et vidéos tirées de l’application réelle, avec un cabinet de
démonstration aux données fictives et réalistes (patients, séances,
factures, statistiques) :

- **Captures** : format et cadrage identiques, fenêtre d’application stylisée,
  haute définition, thème clair et sombre, recadrées sur l’élément démontré
  avec une annotation courte.
- **Vidéos en boucle** de 10 à 20 secondes, sans son, lancées
  automatiquement au défilement : plus légères et plus nettes qu’une vidéo
  Vimeo, et elles montrent un geste précis. Premières candidates :
  Ctrl + K vers une consultation, finalisation, Ma journée vers les
  onglets, import Doctolib, organisation du tableau de bord.
- **Dictée vocale** : la seule démonstration à filmer en vrai, avec voix,
  car une simulation se verrait.
- **Illustrations** : à garder éventuellement pour la section « quotidien »,
  dans un style propre à la marque, ou à remplacer par des photos de cabinet.
