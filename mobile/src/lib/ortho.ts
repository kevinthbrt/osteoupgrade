/**
 * Helpers partagés pour le module Tests orthopédiques.
 */

export type VideoSource =
  | { kind: 'youtube'; id: string }
  | { kind: 'vimeo'; url: string }
  | null;

/** Détecte la plateforme et l'identifiant d'une vidéo de test. */
export function parseVideo(url: string | null): VideoSource {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return { kind: 'youtube', id: yt[1] };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: 'vimeo', url: `https://player.vimeo.com/video/${vm[1]}?color=4169F6` };
  return null;
}

/** URL de repli pour ouvrir la vidéo hors app. */
export function watchUrl(v: { kind: 'youtube'; id: string } | { kind: 'vimeo'; url: string }): string {
  return v.kind === 'youtube' ? `https://youtu.be/${v.id}` : v.url;
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
