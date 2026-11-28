-- Chapitre pilote du lecteur animé : « Les fausses croyances qu'on transmet
-- aux patients ». Voir docs/PARCOURS_ANIMES.md.
--
-- Le texte des sections ne change pas. On ajoute :
--   * un personnage et une réplique à chaque section ;
--   * une scène d'ouverture (after_section = -1) ;
--   * trois « Que dites-vous au patient ? », chacun juste après la croyance
--     qu'il travaille. Les bonnes réponses reprennent les formulations de
--     remplacement du chapitre ; les mauvaises sont des phrases réellement
--     entendues en cabinet.
--
-- Rejouable : les activités ajoutées ici sont supprimées puis réinsérées, les
-- activités existantes du chapitre ne sont pas touchées.

DO $do$
DECLARE
  v_ch UUID;
  v_n INTEGER;
BEGIN
  SELECT c.id INTO v_ch
    FROM public.region_chapters c
    JOIN public.region_modules m ON m.id = c.module_id
   WHERE m.slug = 'lombaire' AND c.slug = 'fausses-croyances';
  IF v_ch IS NULL THEN
    RAISE EXCEPTION 'Chapitre fausses-croyances absent';
  END IF;

  UPDATE public.region_chapters SET anime = true WHERE id = v_ch;

  -- Les personnages des sections, repérées par leur titre.
  UPDATE public.region_chapter_sections s
     SET personnage = x.personnage, expression = x.expression, replique = x.replique
    FROM (VALUES
      ('Pourquoi ce chapitre existe', 'osteo', 'sourire',
       'Ce que vous dites en fin de séance, le patient le répétera encore dans dix ans. Autant bien choisir.'),
      ('« Vous avez une vertèbre déplacée, un bassin décalé »', 'vertebre', 'stresse',
       'Déplacée, moi ? Je n’ai pas bougé d’un millimètre !'),
      ('« C’est votre posture, tenez-vous droit »', 'patient', 'reflechit',
       'Toute ma vie, on m’a dit de me tenir droit… Et j’ai quand même mal.'),
      ('« Il faut plier les genoux, ne jamais arrondir le dos »', 'disque', 'etirement',
       'Plier, je sais faire. C’est même tout mon travail.'),
      ('« Il faut muscler la sangle abdominale, gainer le transverse »', 'patient', 'douleur',
       'Je serre le ventre toute la journée, comme on me l’a appris. Et ça ne passe pas.'),
      ('« Avec l’arthrose et la hernie que vous avez… »', 'disque', 'accuse',
       'On m’accuse sur un compte rendu d’IRM ! Lisez les chiffres avant de me condamner.'),
      ('« Reposez-vous, évitez de porter, mettez une ceinture »', 'bassin', 'perplexe',
       'Me reposer au lit ? Rien de tel pour me raidir.'),
      ('« Ça a bien craqué, c’est remis »', 'vertebre', 'perplexe',
       'Le bruit ? Il ne dit rien de ce qui a changé. Regardez plutôt le mouvement.'),
      ('La règle générale', 'osteo', 'debout',
       'Deux questions avant chaque explication. Elles évitent presque toutes les phrases de ce chapitre.')
    ) AS x(titre, personnage, expression, replique)
   WHERE s.chapter_id = v_ch AND s.title = x.titre;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  IF v_n <> 9 THEN
    RAISE EXCEPTION 'Personnages : % sections trouvées sur 9', v_n;
  END IF;

  DELETE FROM public.region_chapter_activities
   WHERE chapter_id = v_ch AND kind IN ('scene', 'que_dire');

  INSERT INTO public.region_chapter_activities (chapter_id, kind, title, prompt, payload, explanation, order_index, after_section) VALUES
  (v_ch, 'scene', 'Huit ans plus tard', NULL,
   $j${"repliques": [
     {"personnage": "patient", "expression": "raconte", "texte": "Il y a huit ans, un praticien m’a dit que j’avais une vertèbre déplacée. Depuis, je n’ose plus me pencher."},
     {"personnage": "osteo", "expression": "sourire", "texte": "Huit ans, et il s’en souvient mot pour mot. C’est exactement ce que décrit l’étude de Darlow."},
     {"personnage": "patient", "expression": "douleur", "texte": "Alors, elle est toujours déplacée ?"},
     {"personnage": "osteo", "expression": "sourire", "texte": "Voyons ensemble ce que disent les données, et surtout ce que vous pourriez lui répondre."}
   ]}$j$::jsonb,
   NULL, 0, -1),

  (v_ch, 'que_dire', 'Après la séance',
   'M. Bernard se relève de la table. Que lui répondez-vous ?',
   $j${"personnage": "patient", "expression": "raconte",
     "question": "Ça a craqué tout à l’heure… Elle est bien remise en place, ma vertèbre ?",
     "options": [
       {"label": "Oui, c’est remis. Revenez dès que ça se redéplace.", "correct": false, "expression": "soulage",
        "reaction": "Ah, tant mieux ! Je reviendrai dès que ça se redéplace, alors.",
        "feedback": "Il est soulagé, mais vous venez de le rendre dépendant : à chaque douleur, il croira qu’une vertèbre s’est déplacée et qu’il lui faut quelqu’un pour la remettre."},
       {"label": "Rien ne s’était déplacé. Ce segment était douloureux et bougeait moins bien ; on lui a redonné de la mobilité, et c’est le mouvement qui va entretenir le résultat.", "correct": true, "expression": "soulage",
        "reaction": "Donc je peux me pencher sans risque ? Ça me rassure.",
        "feedback": "Vrai, et utile : la gêne est expliquée sans fragilité, et la suite dépend de lui, pas de vous."},
       {"label": "Votre bassin était bloqué. Il faudra surveiller ça toute votre vie.", "correct": false, "expression": "douleur",
        "reaction": "Toute ma vie ? Mais alors je suis fragile…",
        "feedback": "Une fragilité annoncée et invérifiable, qui va guider ses gestes pendant des années."}
     ]}$j$::jsonb,
   NULL, 1, 1),

  (v_ch, 'que_dire', 'Le compte rendu d’IRM',
   'M. Bernard vous tend le compte rendu de son IRM. Que lui répondez-vous ?',
   $j${"personnage": "patient", "expression": "raconte",
     "question": "Regardez : « discopathie dégénérative et protrusion L4-L5 ». J’ai le dos d’un vieux, non ?",
     "options": [
       {"label": "Effectivement, votre dos est usé. Il va falloir le ménager.", "correct": false, "expression": "douleur",
        "reaction": "Le ménager… Je vais arrêter le jardinage, alors.",
        "feedback": "« Usé » annonce une dégradation irréversible, et l’évitement suit. L’évitement d’activité est l’un des meilleurs prédicteurs d’incapacité à un an."},
       {"label": "Ne regardez pas ces comptes rendus, ils ne veulent rien dire.", "correct": false, "expression": "reflechit",
        "reaction": "Mais alors, pourquoi on me l’a fait faire ?",
        "feedback": "Balayer le document laisse le patient seul avec son inquiétude et met en doute le médecin qui l’a prescrit. Mieux vaut le reprendre avec lui."},
       {"label": "Ces images se voient chez la plupart des gens de votre âge qui n’ont jamais eu mal. C’est comme les rides : le signe que le dos a vécu, pas qu’il est abîmé.", "correct": true, "expression": "soulage",
        "reaction": "Comme les rides… Je ne l’avais jamais vu comme ça.",
        "feedback": "C’est la formulation du chapitre : elle est vraie, et elle désamorce l’inquiétude née du compte rendu."}
     ]}$j$::jsonb,
   NULL, 2, 5),

  (v_ch, 'que_dire', 'Pas de craquement',
   'En fin de séance, M. Bernard a l’air déçu. Que lui répondez-vous ?',
   $j${"personnage": "patient", "expression": "reflechit",
     "question": "Aujourd’hui, ça n’a pas craqué. Ça n’a pas marché, alors ?",
     "options": [
       {"label": "Le bruit ne dit rien du résultat. Refaites le mouvement qui vous faisait mal tout à l’heure : comment est-il maintenant ?", "correct": true, "expression": "soulage",
        "reaction": "Tiens… C’est vrai que je me penche mieux.",
        "feedback": "Vous remplacez un faux critère, le bruit, par un vrai : le signe comparable, que le patient constate lui-même."},
       {"label": "Votre dos était trop raide aujourd’hui, on réessaiera la prochaine fois.", "correct": false, "expression": "reflechit",
        "reaction": "D’accord… J’espère que ça craquera la prochaine fois.",
        "feedback": "Il juge désormais la séance à son bruit, et reviendra pour l’entendre."},
       {"label": "Pour que ça craque, il faut que vous soyez bien détendu.", "correct": false, "expression": "douleur",
        "reaction": "Donc c’est de ma faute si ça n’a pas marché ?",
        "feedback": "Le craquement devient un objectif, et l’échec lui est attribué. Les essais montrent pourtant des résultats comparables avec ou sans bruit."}
     ]}$j$::jsonb,
   NULL, 3, 7);
END
$do$;
