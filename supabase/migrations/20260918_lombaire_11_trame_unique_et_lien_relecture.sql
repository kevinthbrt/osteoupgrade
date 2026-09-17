-- 1. La trame en six temps redevient une seule section.
--    Elle avait été coupée en deux uniquement parce que le bloc était long,
--    ce qui faisait lire « (suite) » comme une étape du raisonnement.
--    Le fichier 20260916_lombaire_02_examiner.sql est corrigé en conséquence :
--    cette migration ne sert qu'aux bases où l'ancienne version a déjà été
--    appliquée.

DO $do$
DECLARE
  v_chapter UUID;
BEGIN
  SELECT c.id INTO v_chapter
    FROM public.region_chapters c
    JOIN public.region_modules m ON m.id = c.module_id
   WHERE m.slug = 'lombaire' AND c.slug = 'anamnese';

  IF v_chapter IS NOT NULL THEN
    UPDATE public.region_chapter_sections
       SET body_html = '<p><strong>1. Le motif et l’histoire.</strong> Depuis quand, comment cela a commencé, y avait-il un facteur déclenchant, comment cela a évolué depuis. Un début brutal en flexion-rotation avec charge, une installation progressive sans cause, un réveil un matin sans raison : ces trois récits n’ouvrent pas les mêmes hypothèses.</p><p><strong>2. La topographie.</strong> Faire montrer, ne pas se contenter d’écouter. Le patient qui dit « ça descend dans la jambe » désigne parfois la fesse et le haut de cuisse, ce qui n’est pas une sciatique. Noter le point maximal, l’irradiation, sa limite distale, la présence de paresthésies et leur territoire.</p><p><strong>3. Le comportement.</strong> Qu’est-ce qui aggrave, qu’est-ce qui soulage, comment se passe la nuit, comment se passe le matin, comment évolue la douleur au fil de la journée. C’est ici que se joue le tri mécanique contre non mécanique et mécanique contre inflammatoire.</p><p><strong>4. Le tri de sécurité.</strong> Antécédents personnels, en insistant sur le cancer, la corticothérapie, l’ostéoporose, l’immunodépression, les infections récentes, les gestes rachidiens récents. Puis les questions de queue de cheval, systématiques dès qu’il y a une radiculalgie. Puis les signes généraux : fièvre, amaigrissement, altération de l’état général.</p><p><strong>5. Le retentissement.</strong> Ce que le patient ne peut plus faire, au travail, à la maison, dans ses loisirs, et depuis combien de temps. C’est ce qui donne les objectifs du traitement, et c’est aussi la mesure du résultat.</p><p><strong>6. Les représentations et le contexte.</strong> Ce que le patient croit avoir, ce qu’on lui a dit, ce qu’il attend, ce qu’il craint, sa situation professionnelle, un éventuel litige ou arrêt prolongé.</p>'
     WHERE chapter_id = v_chapter AND title = 'La trame en six temps';

    DELETE FROM public.region_chapter_sections
     WHERE chapter_id = v_chapter AND title = 'La trame en six temps (suite)';
  END IF;
END $do$;

-- 2. Lien de relecture.
--
-- Partager un parcours en brouillon avec un confrère sans le publier et sans
-- lui ouvrir un compte : même mécanisme que les enquêtes `/avis/<token>`, un
-- jeton qui est la seule clé et qui n'ouvre que ce contenu, en lecture seule.
--
-- Le jeton est NULL par défaut : aucun lien n'existe tant qu'un administrateur
-- ne l'a pas créé, et le remettre à NULL le révoque immédiatement. Aucune
-- politique `anon` n'est ouverte : la page est servie par la clé service-role,
-- comme les pages funnel et les enquêtes.

ALTER TABLE public.region_modules
  ADD COLUMN IF NOT EXISTS preview_token UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS preview_created_at TIMESTAMPTZ;

COMMENT ON COLUMN public.region_modules.preview_token IS 'Jeton de relecture. NULL tant qu''aucun lien n''a été créé ; le remettre à NULL révoque le lien. La page /apercu/<token> est servie par la clé service-role, aucune politique anon n''est ouverte.';
