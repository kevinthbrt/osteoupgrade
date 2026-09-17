# Parcours régionaux

Environnements d’apprentissage par région anatomique, servis sur `/regions`.
Un parcours reprend une région dans l’ordre où le problème se pose en
consultation : trier, reconnaître le tableau clinique, traiter, réorienter.

Premier parcours livré : **Région lombaire**, 26 chapitres.

## Pourquoi un module de plus

Les briques existaient déjà et étaient bonnes : `pathologies`,
`orthopedic_tests`, `orthopedic_test_clusters`, `practice_videos`,
`rehab_exercises`. Ce qui manquait, c’était le fil : un praticien qui voulait
devenir compétent sur la lombalgie devait ouvrir quatre modules distincts et
deviner l’ordre dans lequel les parcourir.

Les parcours régionaux ajoutent cette couche, et rien d’autre. **Aucune donnée
clinique n’est recopiée** : un test reste dans `orthopedic_tests`, une vidéo
dans `practice_videos`. Corriger une sensibilité à un seul endroit continue de
corriger tout le site, la fiche du test comme le chapitre qui la cite.

## Structure

| Élément | Emplacement |
|---|---|
| Index des parcours | `app/regions/page.tsx` |
| Sommaire d’un parcours | `app/regions/[slug]/page.tsx` |
| Lecture d’un chapitre | `app/regions/[slug]/[chapitre]/page.tsx` |
| Administration | `app/admin/regions/page.tsx` |
| Types et libellés | `lib/region-modules.ts` |
| Schéma | `supabase/migrations/20260916_parcours_regionaux.sql` |
| Contenu lombaire | `supabase/migrations/20260916_lombaire_0*.sql` |
| Compléments de tests | `supabase/migrations/20260916_tests_lombaires_complements.sql` |

## Tables

- `region_modules` : un parcours par région. `status` vaut `draft`,
  `published` ou `archived`.
- `region_chapters` : chapitres ordonnés, regroupés par `part` (le libellé de
  partie affiché dans le sommaire) et typés par `kind`.
- `region_chapter_sections` : le contenu, en HTML, avec un `callout` qui décide
  de l’habillage (point clé, drapeau rouge, niveau de preuve, piège, mise en
  pratique, réorientation).
- `region_chapter_tests`, `_clusters`, `_pathologies`, `_exercises` : liaisons
  vers les briques existantes, avec une note propre au chapitre.
- `region_chapter_techniques` : le catalogue de gestes recommandés.
- `region_chapter_references` : la bibliographie, chapitre par chapitre.
- `region_chapter_progress` : une ligne par chapitre terminé et par utilisateur.

## Une technique existe avant sa vidéo

C’est le point de conception qui compte. Le catalogue des gestes fondés sur les
preuves est plus large que ce qui est filmé : refuser d’écrire une technique
tant que la vidéo n’existe pas aurait amputé le contenu de tout ce qui est
recommandé mais pas encore tourné (SNAG de Mulligan, protocole McKenzie complet,
puncture sèche, neuromobilisation).

Donc : `to_film = true` marque ce qui reste à produire, `film_brief` dit ce que
la vidéo doit montrer, et `practice_video_id` relie la technique à sa
démonstration dès qu’elle existe. Le lecteur voit « démonstration en cours de
tournage » plutôt qu’une absence inexpliquée, et l’administration en tire sa
liste de tournage.

Associer une vidéo depuis `/admin/regions` remplit `practice_video_id` et
repasse `to_film` à faux : la liste se vide d’elle-même.

## Visibilité

Un module en `draft` n’est lisible que des administrateurs, la policy de
lecture laissant passer `is_admin()`. C’est volontaire : le contenu clinique
est relu avant d’être servi aux abonnés. La publication se fait en un bouton,
depuis le sommaire du parcours ou depuis `/admin/regions`.

L’accès payant suit le reste du site : `is_free_access` sur le module ou sur le
chapitre ouvre le contenu aux comptes gratuits, sinon `hasOsteoupgrade` décide,
et `FreeContentGate` floute ce qui est verrouillé.

## Écrire un nouveau chapitre

Le contenu vit en base et se crée par migration, comme les séquences d’emails.
Le gabarit est celui des fichiers `20260916_lombaire_0*.sql` :

- un bloc `DO $do$ ... END $do$;` qui récupère le module par son slug ;
- un `INSERT ... ON CONFLICT (module_id, slug) DO UPDATE` par chapitre, ce qui
  rend la migration rejouable ;
- un `DELETE` puis un `INSERT` pour les sections, les techniques et les
  références, faute de clé naturelle sur ces tables ;
- des liaisons par jointure sur le **nom** de la brique citée, jamais sur son
  identifiant : `JOIN public.orthopedic_tests t ON btrim(t.name) = x.test_name`.

Deux pièges vérifiés à l’usage :

- **`btrim` sur les noms de tests.** Certaines fiches historiques portent une
  espace finale (« Test de FABER »). Une égalité stricte échouerait sans aucun
  message, et le chapitre s’afficherait simplement sans son test.
- **L’apostrophe.** Le contenu utilise l’apostrophe typographique (`’`) exigée
  par les règles de rédaction, ce qui évite tout doublement dans les chaînes
  SQL. Mais les noms des briques déjà en base utilisent parfois l’apostrophe
  droite : dans une jointure, il faut reprendre le nom **tel qu’il est stocké**,
  donc `'Test d''Instabilité en Procubitus (PIT)'`.

Après écriture, vérifier que chaque liaison a bien trouvé sa cible :

```sql
select c.slug,
  (select count(*) from region_chapter_tests t where t.chapter_id = c.id) as tests,
  (select count(*) from region_chapter_pathologies p where p.chapter_id = c.id) as pathologies
from region_chapters c
join region_modules m on m.id = c.module_id
where m.slug = 'lombaire'
order by c.order_index;
```

Un compte à zéro là où le fichier en attendait plusieurs signale une jointure
qui n’a rien trouvé.

## Chiffres et honnêteté des sources

Sur les fiches de tests créées pour ce parcours, `sensitivity` et `specificity`
ne sont renseignées que lorsque la littérature donne un chiffre stable sur une
population définie. Les autres restent vides, et l’explication passe dans
`interest`. Un chiffre inventé serait pire que pas de chiffre : il serait
utilisé pour décider. Le chapitre « Décider avec des probabilités » dit
explicitement au lecteur qu’une case vide est un choix, pas un oubli.

## L'axe du parcours : quatre décisions, pas une liste d'organes

C'est le point de conception le plus important, et il a été corrigé après coup.

La première version organisait la partie diagnostique par tissu : discogénique, facettaire, instabilité, sacro-iliaque. Cet ordre venait de la table `pathologies`, pas de la littérature. Le problème est qu'il contredisait le contenu : trois de ces chapitres expliquent qu'aucun test clinique ne permet d'identifier le tissu source de façon fiable. Le parcours enseignait donc une chose et s'organisait selon son contraire.

La colonne vertébrale est maintenant ce qui décide réellement du traitement, dans un ordre où chaque question suppose la précédente résolue :

1. **Est-ce que cela relève de moi ?** Parties « Trier » et « Interroger et examiner ».
2. **Quel mécanisme de douleur domine ?** Nociceptif, neuropathique, nociplastique. Critères IASP, gradation de Finnerup, critères de Kosek 2021.
3. **Quel profil de réponse au traitement ?** Modulation des symptômes, contrôle du mouvement, optimisation fonctionnelle. Classification de Delitto révisée par Alrwaily 2016.
4. **Quel risque de chronicisation ?** STarT Back, et la grille par durée et par risque de la HAS.

Ces trois derniers axes forment la partie **« Classer pour décider »**, placée avant les tableaux cliniques.

### Pourquoi les chapitres tissulaires ont été gardés

Ils n'ont pas été supprimés : leur contenu est bon, et il faut savoir reconnaître ces tableaux. Ils ont changé de statut. La partie s'appelle désormais **« Répertoire des tableaux cliniques »**, et le chapitre `croiser-les-axes` dit explicitement à quoi elle sert : reconnaître les tableaux qui se distinguent vraiment (sténose, radiculopathie, ceinture pelvienne, voisinage), savoir ce qu'on ne peut pas affirmer (discogénique, facettaire, instabilité), et affiner une première intention **après** que les quatre axes sont posés.

La règle donnée au lecteur, et qui vaut aussi pour qui écrira le prochain parcours : si le plan de traitement change selon le tableau qu'on nomme, vérifier que ce n'est pas le mécanisme ou le profil qui aurait dû le décider.

### Conséquence pour un nouveau parcours régional

Reprendre cette ossature plutôt que la liste des pathologies de la région. Les parties « Comprendre », « Trier », « Interroger et examiner », « Classer pour décider », « Traiter », « Déjouer les pièges », « Orienter » et « Intégrer » sont transposables telles quelles ; seuls le répertoire des tableaux et les techniques sont propres à la région.

L'ordre d'affichage des parties est fixé par `PART_ORDER` dans `lib/region-modules.ts`, pas par l'ordre alphabétique : une nouvelle partie doit y être ajoutée, sinon elle tombe en fin de sommaire.

## Activités interactives

`region_chapter_activities` porte les exercices d'un chapitre, `region_activity_attempts` le dernier état de chaque réponse par utilisateur. Le rendu est dans `components/regions/ChapterActivities.tsx`.

Un seul type de ligne, un `kind` et un `payload` JSON. Les formats d'activité évoluent plus vite qu'un schéma, et une table par format aurait imposé une migration à chaque nouvelle idée pédagogique.

| `kind` | Forme du `payload` |
|---|---|
| `qcm` | `{multiple, options:[{label, correct, feedback}]}` |
| `vrai_faux` | `{statements:[{label, correct, feedback}]}` |
| `tri_drapeaux` | `{niveaux:[…], items:[{label, niveau, feedback}]}` |
| `cas_etape` | `{steps:[{situation, question, options:[{label, correct, feedback}]}]}` |
| `probabilite` | `{prevalence, prevalence_label, tests:[{name, se, sp}]}` |

Le score n'est pas une note : il sert à savoir ce qui reste à revoir. Les réponses sont donc enregistrées en dernier état, sans historique, et une activité peut être refaite autant de fois qu'on veut. Un échec d'enregistrement n'interrompt jamais l'exercice.

### Le calculateur de probabilité

C'est l'activité qui justifie le mécanisme. Le chapitre sur les rapports de vraisemblance explique en mots qu'un test sensible et peu spécifique ne sert qu'à écarter ; le calculateur le fait constater. On coche « Lasègue positif » et la probabilité bouge de trois points, on coche « Lasègue négatif » et elle s'effondre.

Point de conception à préserver : **les rapports de vraisemblance ne sont jamais saisis à la main**. Le `payload` ne stocke que la sensibilité et la spécificité lues dans `orthopedic_tests` au moment de la migration, et `likelihoodRatios()` les recalcule à l'affichage. Un chiffre corrigé sur une fiche corrige donc aussi l'exercice, et l'exercice ne peut pas contredire la fiche qu'il cite.

Deux garde-fous dans le calcul : une spécificité à 100 % donnerait un rapport positif infini et une sensibilité à 100 % un rapport négatif nul, deux artefacts d'arrondi que `likelihoodRatios()` borne ; et la probabilité de départ est ramenée dans l'intervalle [0,1 %, 99,9 %] pour éviter une division par zéro.

## D'où vient le contenu

Les sources sont les instances et les revues systématiques, pas ce que la base contenait déjà. Trois références de cadrage, vérifiées auprès de l'émetteur et liées depuis les chapitres :

- **HAS**, fiche mémo « Prise en charge du patient présentant une lombalgie commune », adoptée le 27 mars 2019. C'est la référence opposable en France, et elle apporte la grille par durée et par risque, dont la catégorie « à risque de chronicité » que les recommandations anglo-saxonnes nomment moins nettement.
- **NICE NG59**, dont la mise à jour du 29 juillet 2026 a retiré les recommandations 1.2.13 et 1.2.14 et amendé les 1.1.3 et 1.2.7.
- **OMS**, guide 2023 sur la prise en charge non chirurgicale de la lombalgie chronique primaire, dont toutes les recommandations sont conditionnelles.

### Vérifier avant de republier

Le cas du NICE de juillet 2026 est l'exemple à retenir : deux recommandations ont été retirées parce que des travaux qui les fondaient ont été **rétractés**. Un module écrit de mémoire six mois plus tôt les enseignait encore.

Avant toute republication d'un parcours, reprendre les recommandations citées à leur source et vérifier qu'elles n'ont pas bougé. Quand deux instances divergent, le dire dans le contenu plutôt que choisir : le chapitre « principes-traitement » porte une section entière sur la divergence NICE et OMS à propos des approches psychologiques, et c'est un meilleur enseignement qu'une liste tranchée.

## Vidéo sur les tests

Les fiches de `orthopedic_tests` portent un `video_url`, le plus souvent YouTube. La page de chapitre en affiche la vignette et lance la lecture au clic, à côté de la sensibilité et de la spécificité. Les helpers sont dans `lib/region-modules.ts` (`youtubeId`, `youtubeThumbnail`, `youtubeEmbed`), séparés des helpers Vimeo qui servent aux vidéos de pratique.

Sur les tests actuellement cités par le parcours lombaire, six portent une vidéo. Les autres s'affichent sans, sans message d'erreur : la vignette apparaît d'elle-même le jour où la fiche reçoit son URL.

## L'arbre de décision

Le chapitre `arbre-decisionnel` de la partie « Intégrer » porte une activité de type `arbre_decision`. Son `payload` est un dictionnaire de nœuds et la clé du premier :

```json
{
  "racine": "securite",
  "noeuds": {
    "securite": { "type": "question", "axe": "Axe 1, sécurité", "texte": "…",
                  "options": [{ "label": "…", "vers": "fin_urgence" }] },
    "fin_urgence": { "type": "conclusion", "ton": "urgence", "titre": "…",
                     "conduite": "…", "pourquoi": "…" }
  }
}
```

Le rendu (`components/regions/ChapterActivities.tsx`) déroule l'arbre nœud par nœud en affichant le chemin parcouru, chaque étape étant cliquable pour y revenir. C'est le chemin qui enseigne : au bout, le praticien voit que la décision s'est jouée sur la sécurité, sur le comportement de la douleur et sur la réponse au mouvement, presque jamais sur le nom d'un tissu. L'arbre n'est pas noté et ne compte pas dans le score du chapitre.

Le `ton` d'une conclusion décide de la couleur de la carte finale : `urgence`, `orienter`, `traiter`. Il n'y a pas d'autre valeur, et le rendu retombe sur `traiter` si elle est inconnue.

## Simulateur de consultation

`/regions/<slug>/simulateur`. Un patient est tiré au sort, le praticien mène l'anamnèse en langage libre, décide des examens, puis conclut. Deux tables : `region_simulation_cases` et `region_simulation_sessions`.

**Ce que le modèle fait, et ce qu'il ne fait pas.** Il joue le patient pendant l'anamnèse, c'est tout. Il ne décide jamais du résultat d'un examen : celui-ci est lu dans le cas, et à défaut c'est le résultat normal du catalogue `lib/region-simulation.ts` qui est renvoyé. Sans cette règle, le même test répété donnerait deux réponses différentes et la conclusion ne serait plus corrigeable. Il ne corrige pas non plus : la comparaison entre la conclusion choisie et la conclusion attendue est un test d'égalité, le modèle n'écrit que le commentaire.

**Le résultat normal appartient au catalogue, pas au cas.** Un cas ne décrit que ce qu'il a d'anormal. C'est ce qui le garde lisible et ce qui évite qu'un oubli produise un « sans particularité » invraisemblable sur un examen que personne n'a pensé à renseigner.

**Les conclusions proposées sont les feuilles de l'arbre.** Elles ne sont pas recopiées dans le simulateur : la route les lit dans le `payload` de l'activité `arbre_decision` du parcours. Un cas dont l'`expected.issue` ne correspondrait à aucune feuille serait incorrigeable, et la migration des cas vérifie ce point dans sa propre transaction : elle échoue plutôt que de laisser passer un cas orphelin.

**Les cas contiennent leur solution.** `region_simulation_cases` n'a donc aucune politique de lecture pour un utilisateur ordinaire : tout passe par la route `/api/regions/simulateur` et la clé service-role. Le rendre lisible au navigateur reviendrait à afficher la réponse dans la console. Même logique pour l'écriture des sessions : un utilisateur lit les siennes, il ne les écrit pas, sinon le verdict serait modifiable par celui qu'il évalue.

**Modèles.** Le patient répond avec un modèle intermédiaire, le débriefing avec le modèle supérieur, et la route redescend d'un cran si la clé n'a pas accès à ce dernier plutôt que de casser une consultation en cours. La consommation est journalisée dans `ai_cache_logs` sous les points d'entrée `simulateur-patient` et `simulateur-debrief`.

**Écrire un cas.** Vingt cas couvrent les dix-sept feuilles de l'arbre lombaire, les trois orientations en urgence étant représentées par trois tableaux différents. Pour en ajouter un :

1. choisir la feuille de l'arbre que le cas doit faire atteindre ;
2. écrire `presentation` (ce que le praticien voit en entrant) et `secret` (ce que le patient sait et ne dira que si on le lui demande, avec un champ `a_ne_pas_dire_spontanement`) ;
3. ne renseigner dans `exams` que les résultats anormaux ou spécifiques ;
4. remplir `expected` : `issue`, `tableau`, `elements`, `examens_cles`, `piege` ;
5. écrire `debrief`, la leçon du cas, affichée après la correction.

Le champ `piege` mérite un soin particulier : c'est lui qui distingue un cas d'un exercice. Le patient qui réclame une manipulation alors qu'il fait une queue de cheval, celui qui arrive avec le diagnostic d'un confrère, celle qui tient à son IRM.
