/**
 * Charte couleur alignée sur le site OsteoUpgrade (cf. tailwind.config.ts
 * et app/globals.css du projet web).
 * - Primaire : #2563eb (blue-600)
 * - Dégradé signature MyOsteoflow : bleu #4169F6 → violet #7F47E1
 * - Glass cards : surfaces translucides + blur
 */

// Couleur primaire (blue-600 du site)
export const BRAND = '#2563eb';

// Échelle de bleus (identique au site)
export const BLUE = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
} as const;

// Dégradés signature
export const GRADIENTS = {
  brand: ['#4169F6', '#7F47E1'] as [string, string], // bleu → violet (signature)
  blue: ['#2563eb', '#1d4ed8'] as [string, string],
  green: ['#22c55e', '#16a34a'] as [string, string],
  orange: ['#f97316', '#ea580c'] as [string, string],
  violet: ['#8b5cf6', '#6d28d9'] as [string, string],
  red: ['#ef4444', '#dc2626'] as [string, string],
} as const;

export type Palette = {
  bgGradient: [string, string, string];
  bg: string;
  card: string;
  cardSolid: string;
  tabBar: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  inactive: string;
  border: string;
  glassBorder: string;
  glassOverlay: string;
};

export const PALETTE: { light: Palette; dark: Palette } = {
  light: {
    // Fonds dégradés d'écran (teintes claires bleutées)
    bgGradient: ['#eff6ff', '#f8fafc', '#ffffff'] as [string, string, string],
    bg: '#f8fafc',
    card: 'rgba(255,255,255,0.7)',
    cardSolid: '#ffffff',
    tabBar: 'rgba(255,255,255,0.92)',
    text: '#0f172a', // slate-900
    textSecondary: '#64748b', // slate-500
    textMuted: '#94a3b8', // slate-400
    inactive: '#94a3b8',
    border: 'rgba(15,23,42,0.08)',
    glassBorder: 'rgba(255,255,255,0.6)',
    glassOverlay: 'rgba(255,255,255,0.45)',
  },
  dark: {
    bgGradient: ['#0b1220', '#0f172a', '#0f172a'] as [string, string, string],
    bg: '#0f172a', // slate-900 (fond du site en dark)
    card: 'rgba(30,41,59,0.7)', // slate-800
    cardSolid: '#1e293b',
    tabBar: 'rgba(15,23,42,0.92)',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    inactive: '#64748b',
    border: 'rgba(255,255,255,0.08)',
    glassBorder: 'rgba(255,255,255,0.12)',
    glassOverlay: 'rgba(255,255,255,0.05)',
  },
};

export function usePaletteFor(scheme: 'light' | 'dark' | null | undefined): Palette {
  return PALETTE[scheme === 'dark' ? 'dark' : 'light'];
}
