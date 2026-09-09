/**
 * Récupère une URL de lecture directe (HLS/MP4) pour une vidéo Vimeo,
 * via l'endpoint serveur /api/vimeo-play (le token Vimeo reste côté serveur).
 * Renvoie null en cas d'échec → l'app retombe sur la WebView Vimeo.
 */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://osteoupgrade.vercel.app';

/**
 * Lecture native désactivée par défaut : le plan Vimeo actuel (Starter)
 * n'expose pas les flux directs via l'API. Passe EXPO_PUBLIC_VIMEO_NATIVE=1
 * si tu montes en plan Advanced+ pour réactiver expo-video (repli WebView sinon).
 */
export const NATIVE_VIMEO_ENABLED = process.env.EXPO_PUBLIC_VIMEO_NATIVE === '1';

export async function getNativeVimeoUrl(vimeoId: string): Promise<string | null> {
  if (!NATIVE_VIMEO_ENABLED) return null;
  try {
    const res = await fetch(`${API_BASE}/api/vimeo-play?id=${encodeURIComponent(vimeoId)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

/** Extrait l'id numérique d'une URL Vimeo (ou renvoie l'id tel quel). */
export function vimeoIdFrom(vimeoId: string | null, vimeoUrl: string | null): string | null {
  if (vimeoId && /^\d+$/.test(vimeoId)) return vimeoId;
  if (vimeoUrl) {
    const m = vimeoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return m[1];
  }
  return null;
}
