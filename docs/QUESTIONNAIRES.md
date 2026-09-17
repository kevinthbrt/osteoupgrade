# Questionnaires cliniques

Ils vivent **dans les chapitres qui les enseignent**, pas dans un outil séparé. Un praticien qui apprend à stratifier le risque doit pouvoir faire passer le STarT Back sans quitter la page où on lui explique à quoi il sert.

Le rattachement passe par `region_chapter_questionnaires`, exactement comme un chapitre cite un test ou un exercice : il cite la brique, il ne la recopie pas.

| Chapitre | Questionnaire |
|---|---|
| Drapeaux jaunes et stratification du risque | STarT Back, FABQ |
| Quel mécanisme de douleur domine ? | DN4 |
| La grille de décision | EIFEL, Oswestry |

## Pourquoi ils existent

Le parcours lombaire recommandait le STarT Back dès la première consultation, le simulateur en renvoyait un score quand on demandait l'examen, et la règle de Flynn exige un FABQ-Travail sous 19. Aucun de ces outils n'était disponible sur le site : la formation demandait au praticien des instruments qu'elle ne lui donnait pas.

## Un instrument sans chapitre n'a pas sa place

L'EIFEL et l'Oswestry ont été ajoutés au catalogue avant que le cours n'en parle, ce qui les laissait orphelins. La règle qui en découle : un questionnaire qu'aucun chapitre n'enseigne n'a rien à faire dans le parcours. Soit on écrit le passage qui l'explique, soit on ne l'embarque pas. Ici, la grille de décision a reçu la section « Mesurer, pour pouvoir comparer », et les deux échelles y sont rattachées.

## Ce qui est en ligne

| Code | Items | Méthode de calcul | Ce qu'il décide |
|---|---|---|---|
| STarT Back | 9 | `start_back` | L'intensité de la prise en charge, par le risque de chronicité |
| DN4 | 10 | `somme` | La présence d'une composante neuropathique |
| FABQ | 16 dont 11 scorés | `sous_echelles` | Le pronostic professionnel, et l'item de la règle de Flynn |
| EIFEL | 24 | `somme` | L'incapacité fonctionnelle, et surtout son évolution |
| ODI | 10 sections | `odi` | Le retentissement quotidien, en pourcentage |

## Deux règles de conception

**Le calcul ne vit pas en base.** Aucune de ces règles n'est une somme. Le STarT Back combine un total et un sous-score psychosocial, et dès que le total atteint 4 c'est le sous-score qui tranche, pas le total. L'ODI se rapporte aux seules sections remplies, une section laissée vide sortant du dénominateur au lieu de compter zéro. Le FABQ ne score que onze de ses seize items. Tout cela est dans `lib/questionnaires.ts`, avec `npm run verifier:questionnaires` pour le vérifier. La base ne porte que les seuils et ce qu'on en conclut, ce qui reste modifiable sans déploiement le jour où une recommandation bouge.

**Les items sont réservés aux abonnés, au niveau de la base.** La fiche d'un questionnaire, son objet et sa durée sont visibles de tous : c'est ce qui donne envie de s'abonner. Les items, eux, sont la partie sous licence, et la politique de lecture les réserve aux comptes `osteoupgrade` ou `bundle`, par `public.a_acces_osteoupgrade()`, miroir SQL de `hasOsteoupgrade()`. Verrouiller seulement l'interface aurait laissé les items lisibles par l'API.

**Rien n'est enregistré.** Aucune table de réponses, aucune trace de passation. Le score s'affiche, se copie en une ligne sans donnée identifiante, et disparaît. C'est une plateforme de formation, pas un dossier patient : y stocker des réponses de patients créerait une obligation qui n'a pas lieu d'être ici.

## Licences, et ce qu'il reste à régulariser

C'est le point à ne pas perdre de vue, et il est suivi dans `/admin/questionnaires` plutôt que dans un coin de tête.

- **STarT Back** : Keele le donne librement aux organismes publics et à la recherche non commerciale ; un usage commercial demande un accord au cas par cas, via [keelelicencing.org](https://keelelicencing.org/startmsk-home/).
- **ODI** : distribué par le Mapi Research Trust, gratuit pour l'usage clinique et académique, payant pour un usage commercial.
- **DN4, FABQ, EIFEL** : conditions à vérifier une par une, d'où `licence_statut = 'a_verifier'`.

`licence_statut` prend `libre`, `a_verifier`, `demande_a_faire`, `demandee` ou `obtenue`. Tant qu'un questionnaire n'est ni libre ni obtenu, l'administration affiche un avertissement nominatif et la page de passation le signale au praticien.

## Traduction

`traduction_officielle` vaut faux partout sauf pour le DN4, dont le français est la langue d'origine. Les autres formulations sont fidèles mais ne sont pas les traductions officiellement validées, et la page le dit au praticien.

Un questionnaire validé ne l'est que dans sa formulation validée. C'est le même principe que celui appliqué aux sensibilités du parcours : on n'invente pas un chiffre, on n'invente pas non plus un item. Le jour où une licence apporte la version officielle, les libellés se remplacent depuis `/admin/questionnaires`, sans migration ni déploiement, et la case se coche.

Les échelles de réponse, elles, ne sont pas modifiables depuis l'administration : changer une valeur changerait le score sans que personne s'en aperçoive.

## Ajouter un questionnaire

1. Choisir la méthode de calcul parmi les quatre existantes, ou en ajouter une dans `lib/questionnaires.ts` avec ses cas dans `scripts/verifier-questionnaires.ts`.
2. Insérer la ligne dans `questionnaires` avec ses seuils, sa source, sa licence et son état.
3. Insérer les items avec leur échelle. Un item non scoré porte `sous_echelle = NULL` : il reste affiché, il ne compte pas.
4. Le rattacher au chapitre qui l'enseigne, dans `region_chapter_questionnaires`, avec une note qui dit ce que le praticien doit en retenir. Si aucun chapitre ne l'enseigne, écrire d'abord le passage.
5. Faire vérifier le nombre d'items par la migration elle-même, comme le fait `20260919_questionnaires_lombaire.sql` : un item manquant donne un score faux, et un score faux fait décider de travers.
