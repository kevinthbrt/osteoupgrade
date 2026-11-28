# Parcours animés

Comment transformer les parcours régionaux (`/regions`, voir
`docs/PARCOURS_REGIONAUX.md`) en un module d’apprentissage vivant, avec un
aspect « jeu vidéo », en s’appuyant sur les personnages cartoon créés pour la
communication d’OsteoUpgrade et de MyOsteoflow.

Ce document garde la façon de faire, les idées retenues et celles qui ne le
sont pas (ou pas encore), pour ne pas rediscuter ce qui a déjà été tranché.

Maquette de référence : page privée « Parcours lombaire animé »
(https://claude.ai/artifact/NYTBeitvrvo1Dra184onWk). Elle montre la page de
parcours, l’exercice sur la colonne, le simulateur, une scène d’ouverture et
la fin de chapitre.

## L’objectif pédagogique

Un thérapeute manuel qui termine un parcours doit **tout savoir** de la région :
reconnaître chaque tableau clinique, savoir ce qui ne relève pas de lui et vers
qui l’orienter, et **adapter son traitement** au tableau, au mécanisme de
douleur, au profil et au risque du patient. Il ne pose pas de diagnostic
médical, mais il raisonne comme s’il devait le faire.

L’animation sert cet objectif. Elle ne remplace jamais le contenu : elle le
rend plus facile à suivre, à retenir et à appliquer.

## Ce qui est retenu

### 1. Le texte reste, on le met en scène

Le contenu théorique des chapitres (`region_chapter_sections`) est conservé.
Il est sourcé et relu, c’est lui qui fait la valeur de la formation. On ne
réécrit pas pour faire « fun » : on découpe, on illustre, on fait réagir.

### 2. La structure d’un chapitre en six temps

1. **Ouverture** : une scène de 20 à 30 secondes, un patient arrive avec un
   problème concret. Elle donne envie de connaître la suite.
2. **Notions** : les sections du chapitre, découpées en blocs courts. Chaque
   bloc peut être « porté » par un personnage, mais c’est le texte qui explique.
3. **Vérification immédiate** : une micro-question juste après la notion, et
   non toutes les activités en bas du chapitre.
4. **Au cabinet** : le patient revient, on applique la notion (quoi dire, quoi
   faire, quoi éviter).
5. **À retenir** : les points clés (`key_points`), en cartes à retourner.
6. **Fin de chapitre** : score, animation de réussite, bouton « Chapitre
   suivant ».

Le dosage varie selon le chapitre. Un chapitre de triage ou d’examen garde
plus de texte et de tableaux, avec les personnages surtout dans l’ouverture et
les vérifications. Un chapitre sur les croyances ou l’éducation se prête à une
mise en scène presque complète.

### 3. Trois rôles fixes pour les personnages

| Rôle | Personnage | Ce qu’il porte | À qui il parle |
|---|---|---|---|
| Guide | L’ostéopathe (polo OsteoUpgrade) | La méthode, les pièges, les conseils | À l’apprenant |
| Patient | M. Bernard (gilet beige), puis d’autres patients | Le vécu, les croyances, la réaction aux mots du praticien | Au praticien |
| Anatomie | Le disque, les vertèbres, le bassin | Les mécanismes, à la première personne | À l’apprenant |

**Règle absolue : un personnage ne porte jamais seul une affirmation
scientifique.** Il apporte l’émotion et le point de vue. La donnée est dans le
texte, avec sa référence. Un personnage anatomique qui dit « moi, le disque, je
change avec l’âge » doit être accompagné du chiffre et de la source.

Corollaire : les personnages anatomiques ne doivent pas réintroduire ce que le
parcours combat. Pas de vertèbre « déplacée » qu’on « remet en place », pas de
disque « écrasé ». Quand une croyance fausse apparaît, c’est pour être
démontée (la vertèbre vexée qui proteste « Déplacée, moi ? »).

### 4. Des images fixes animées, avant toute vidéo

Chaque expression d’un personnage est une image détourée. Le site l’anime
lui-même en CSS : respiration au repos, rebond quand c’est juste, tremblement
quand c’est faux, changement d’expression. C’est léger, instantané à charger,
et la cohérence du personnage est parfaite puisque ce sont des images validées.

Les animations respectent `prefers-reduced-motion` et n’animent que
`transform` et `opacity`.

### 5. L’aspect « jeu vidéo »

- **Carte de progression** du parcours : les parties sont des étapes reliées
  par une ligne qui se remplit, chaque partie a son personnage, l’étape en cours
  pulse, les suivantes sont grisées.
- **Réactions** des personnages à chaque réponse.
- **Fin de chapitre** marquée : coche animée, score des activités, confettis,
  personnages qui sautent de joie, chapitre suivant en un clic.
- **Simulateur** de consultation où le patient change d’expression selon les
  questions posées, avec un compteur de drapeaux rouges vérifiés.

### 6. L’exercice « Que dites-vous au patient ? »

Nouveau type d’activité, né du chapitre « Les fausses croyances ». Le patient
pose une question ou montre son IRM, l’apprenant choisit parmi trois
formulations, et le visage du patient réagit (effrayé, perplexe ou soulagé).
La bonne réponse est la formulation de remplacement du chapitre, les mauvaises
sont des phrases réellement entendues en cabinet. L’apprenant **voit** l’effet
nocebo ou rassurant de ses mots, ce que le texte seul ne fait pas ressentir.

### 7. Des scènes diversifiées

On ne répète pas la même mise en scène d’un chapitre à l’autre. Chaque
chapitre choisit ses scènes dans le catalogue ci-dessous, ou en crée une
nouvelle qui rejoint alors le catalogue.

### 8. Travail chapitre par chapitre

Pour chaque chapitre, dans l’ordre :

1. relire le contenu et appliquer les corrections de l’audit
   (`docs/AUDIT_PARCOURS_LOMBAIRE.md`) ;
2. choisir ensemble les scènes : une existante ou une nouvelle ;
3. lister les images manquantes et fournir les prompts ;
4. écrire la migration ;
5. relire en brouillon avant publication.

## Catalogue de scènes

Statut : **existe** (codée dans la maquette), **proposée** (à valider au
premier chapitre qui en a besoin).

| Scène | Statut | Principe | Chapitres pressentis |
|---|---|---|---|
| Ouverture narrative | existe | Dialogue en quelques temps entre patient, guide et personnage anatomique, bouton « Suite » | Tous |
| Le graphique qui s’anime | existe | Les barres d’une donnée clé se construisent sous les yeux, le personnage commente | Épidémiologie, imagerie |
| Trouvez le niveau | existe | Clic sur un disque ou une vertèbre de la colonne, la vertèbre réagit | Radiculopathie, examen neurologique |
| Simulateur à expressions | existe | Questions d’anamnèse, le patient répond et change d’expression | Anamnèse, triage, cas cliniques |
| Fin de chapitre | existe | Coche, score, confettis, chapitre suivant | Tous |
| Que dites-vous au patient ? | proposée | Trois formulations, le patient réagit à chacune | Fausses croyances, éducation, imagerie |
| Le procès | proposée | Un tissu est « accusé » (disque, facette, psoas, sacro-iliaque), on examine les preuves une à une, verdict : coupable, non prouvé ou innocent | Discogénique, facettaire, voisinage, tests à abandonner |
| La salle d’attente | proposée | Plusieurs patients attendent, on les trie : urgence, avis rapide, surveillance, je traite | Drapeaux rouges, réorienter |
| La carte des territoires | proposée | Silhouette où l’on colorie le trajet de la douleur, le personnage indique la racine | Radiculopathie, voisinage |
| Avant / après | proposée | Le même patient avec deux explications différentes, deux trajectoires à six mois | Fausses croyances, drapeaux jaunes |
| Le curseur de probabilité | proposée | Une jauge qui glisse de la probabilité pré-test à post-test à chaque test ajouté | Décider avec des probabilités, clusters |
| Cartes à retourner | proposée | Question au recto, réponse au verso | Tous (points clés) |

## Les personnages

### Disponibles (planches existantes)

- **L’ostéopathe guide** : face, trois quarts, profil, buste bras croisés.
- **M. Bernard**, patient : face, trois quarts, dos ; douleur (main sur les
  lombaires), raconte, réfléchit, soulagé.
- **Le disque** : face, trois quarts, profil ; effrayé, faussement accusé,
  soulagé, heureux en étirement. Porte l’étiquette « L4-L5 ».
- **La colonne L1-S1** : vertèbres à visage ; L3 heureux, stressé, perplexe,
  fier.
- **Le bassin** : face, trois quarts, dos ; fier, paniqué, zen, perplexe, joie.

### Règles pour toute nouvelle image

- une seule expression par image, jamais de planche ;
- **fond transparent** (PNG) si l’outil le permet, sinon fond blanc uni sans
  ombre au sol ;
- carré 1024 × 1024, personnage entier, centré, avec de la marge ;
- **aucun texte dans l’image** : ni étiquette de niveau, ni logo. Le site les
  ajoute par-dessus, ce qui permet de réutiliser le disque à tous les étages ;
- toujours générer à partir de la planche de référence du personnage, pour
  éviter qu’il dérive d’une image à l’autre.

### Prompt type

À envoyer avec la planche du personnage en image de référence. Il est rédigé
en anglais parce que les modèles d’image le suivent plus fidèlement.

```
Using the attached character sheet as the exact reference, create ONE image of this character: [POSE AND EXPRESSION].
Keep the same 3D animated-film style, proportions, colors and outfit as the reference.
Full body, centered, 3/4 front view, generous empty margin on all sides.
Transparent background (PNG). If transparency is not possible: plain pure white background (#FFFFFF), no floor shadow.
No text, no labels, no logo, no other characters. Soft studio lighting from the upper left. Square 1024x1024.
```

### Points à corriger sur les planches actuelles

- le logo du polo de l’ostéopathe est un texte généré, légèrement déformé : à
  remplacer par le vrai logo en retouche pour les gros plans ;
- la coiffure de l’ostéopathe varie entre la vue de face et les autres : fixer
  une version de référence ;
- le disque doit exister **sans** l’étiquette « L4-L5 ».

## Ce qui n’est pas retenu

| Idée | Décision | Raison |
|---|---|---|
| Personnages animés par IA pour montrer des tests ou des techniques | **Refusée** | Les modèles vidéo ne connaissent pas l’anatomie : un geste généré serait approximatif ou faux, ce qui ruine la crédibilité d’une formation. Les gestes restent sur les vidéos Vimeo réelles. |
| Personnage qui énonce seul une donnée scientifique | **Refusée** | Voir la règle des rôles : la donnée reste dans le texte, avec sa source. |
| Réécrire le contenu pour le rendre plus léger | **Refusée** | Le texte est la valeur de la formation. On le découpe et on le met en scène, on ne le dilue pas. |

## Ce qui est en attente

| Idée | Statut | Condition pour la reprendre |
|---|---|---|
| Clips vidéo Kling (ouvertures, mini-histoires, célébrations) | En attente | Une fois les images fixes en place et le style validé sur quelques chapitres. Les planches servent de référence. |
| 3D interactive (modèle `.glb`, `react-three-fiber`) | Plus tard | Après validation des personnages dans les cours. Le disque et les vertèbres, formes simples, seraient les premiers candidats (Meshy ou Tripo pour la conversion). |
| Animations vectorielles Rive ou Lottie | Non prévu | Demande de redessiner les personnages en vectoriel, donc un motion designer. |
| Silhouette cliquable sur l’index des parcours | Proposée | À reprendre quand un deuxième parcours régional existera. |
| Couleur propre à chaque région | Proposée | Idem. |
| Couvertures illustrées (`cover_image_url`, déjà en base mais non affiché) | Proposée | Facile, à faire avec l’index. |
| Série de jours d’étude, badges, certificat de parcours | Proposée | Après la refonte des chapitres. `components/certificates/` existe déjà. |
| Révisions espacées des points clés sur le tableau de bord | Proposée | Idem. |

## Côté technique (prévu)

Rien n’est encore codé dans le site : la maquette est une page indépendante.
L’intégration envisagée, à confirmer au premier chapitre :

- `region_chapter_sections` : colonnes facultatives pour le personnage,
  l’expression, la réplique et le type de scène. Une section sans personnage
  s’affiche comme aujourd’hui, donc rien ne casse.
- `region_chapter_activities` : nouveaux `kind`, à commencer par
  `que_dire` (« Que dites-vous au patient ? ») et `trouver_niveau`.
- Activités placées après une section donnée, et non plus toutes en fin de
  chapitre.
- Composants : `components/regions/Personnage.tsx` (image, expression,
  animation), un composant par type de scène, et la refonte de
  `app/regions/[slug]/[chapitre]/page.tsx` pour enchaîner les blocs.
- Images servies depuis `public/personnages/<personnage>/<expression>.png`.
