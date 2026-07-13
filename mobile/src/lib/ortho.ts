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

/**
 * HTML d'un lecteur YouTube embarqué. Chargé avec `baseUrl` = origine YouTube
 * pour éviter l'erreur 153 (config du lecteur) en WebView React Native.
 */
export function youtubeHtml(videoId: string): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body{margin:0;background:#000;height:100%}.wrap{position:relative;width:100%;height:100%}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head><body><div class="wrap">
<iframe src="https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&origin=https://osteoupgrade.vercel.app"
 allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div></body></html>`;
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
