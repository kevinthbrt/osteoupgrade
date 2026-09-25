-- Emails : une couleur de fond unie sous chaque dégradé.
--
-- Outlook, Hotmail et Outlook.com suppriment les fonds en dégradé
-- (`background: linear-gradient(...)`). Sans couleur de secours, le fond
-- devient transparent : les boutons, texte blanc sur fond blanc, restent
-- cliquables mais invisibles, et le titre blanc du bandeau disparaît. Les 33
-- gabarits étaient concernés, gabarit de référence compris.
--
-- Chaque dégradé devient `background-color` (sa couleur d'arrivée) suivi de
-- `background-image` (le dégradé). Un client qui sait afficher le dégradé
-- l'affiche comme avant ; un client qui le supprime garde la couleur unie.
--
-- Rejouable : ne touche que les dégradés encore écrits sous l'ancienne forme.

UPDATE public.mail_templates
SET html = regexp_replace(html,
      'background:\s*(linear-gradient\([^;"]*(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})[^;"#]*\))',
      'background-color: \2; background-image: \1', 'g'),
    updated_at = now()
WHERE html ~ 'background:\s*linear-gradient';
