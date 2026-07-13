/**
 * Helpers partagés pour le module Tests orthopédiques.
 */

/** Construit une URL d'embed lisible en WebView (YouTube ou Vimeo). */
export function testEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  // YouTube : youtu.be/ID, youtube.com/watch?v=ID, /embed/ID, /shorts/ID
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&playsinline=1`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?color=4169F6`;
  return null;
}

/**
 * Sensibilité / spécificité stockées en pourcentage (0-100).
 * Renvoie une couleur repère selon la qualité.
 */
export function metricColor(v: number | null): string {
  if (v == null) return '#94a3b8';
  if (v >= 80) return '#16a34a';
  if (v >= 60) return '#f59e0b';
  return '#ef4444';
}

/** Affiche un pourcentage (valeur déjà en 0-100). */
export function pctValue(v: number | null): string {
  return v == null ? '—' : `${Math.round(v)}%`;
}

/** Découpe le champ `indications` multi-lignes en liste propre. */
export function parseIndications(text: string | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
