import { useColorScheme } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { BRAND, usePaletteFor } from '@/lib/theme';

/**
 * Carte du corps 2D interactive (vue de face). Chaque zone tapable correspond
 * à une catégorie de tests orthopédiques. Les zones symétriques (gauche/droite)
 * déclenchent la même catégorie.
 *
 * Seules les catégories réellement présentes (`available`) sont actives.
 */

// Zones : catégorie -> liste de hotspots {cx, cy, r} sur un canvas 220 x 470
type Spot = { cx: number; cy: number; r: number };
const ZONES: Record<string, Spot[]> = {
  Cervical: [{ cx: 110, cy: 66, r: 12 }],
  Épaule: [{ cx: 74, cy: 96, r: 15 }, { cx: 146, cy: 96, r: 15 }],
  Thoracique: [{ cx: 110, cy: 116, r: 16 }],
  Côtes: [{ cx: 84, cy: 132, r: 9 }, { cx: 136, cy: 132, r: 9 }],
  Coude: [{ cx: 56, cy: 168, r: 13 }, { cx: 164, cy: 168, r: 13 }],
  Lombaire: [{ cx: 110, cy: 158, r: 15 }],
  'Sacro-iliaque': [{ cx: 92, cy: 196, r: 11 }, { cx: 128, cy: 196, r: 11 }],
  Hanche: [{ cx: 84, cy: 208, r: 13 }, { cx: 136, cy: 208, r: 13 }],
  Poignet: [{ cx: 48, cy: 232, r: 11 }, { cx: 172, cy: 232, r: 11 }],
  Genou: [{ cx: 92, cy: 312, r: 14 }, { cx: 128, cy: 312, r: 14 }],
  Cheville: [{ cx: 92, cy: 404, r: 11 }, { cx: 128, cy: 404, r: 11 }],
  Pied: [{ cx: 92, cy: 436, r: 12 }, { cx: 128, cy: 436, r: 12 }],
};

export function BodyMap({
  available,
  selected,
  onSelect,
  width = 240,
}: {
  available: Set<string>;
  selected: string | null;
  onSelect: (category: string) => void;
  width?: number;
}) {
  const scheme = useColorScheme();
  const C = usePaletteFor(scheme);
  const dark = scheme === 'dark';
  const height = width * (470 / 220);

  const bodyFill = dark ? 'rgba(255,255,255,0.10)' : 'rgba(37,99,235,0.10)';
  const bodyStroke = dark ? 'rgba(255,255,255,0.18)' : 'rgba(37,99,235,0.22)';

  return (
    <Svg width={width} height={height} viewBox="0 0 220 470">
      {/* Silhouette de base (stylisée) */}
      <G fill={bodyFill} stroke={bodyStroke} strokeWidth={2}>
        <Circle cx={110} cy={40} r={26} />
        {/* Tronc */}
        <Path d="M78 74 Q110 66 142 74 L150 150 Q150 200 134 214 L86 214 Q70 200 70 150 Z" />
        {/* Bras */}
        <Path d="M78 88 Q52 100 50 168 Q48 210 44 244 L58 244 Q64 210 64 168 Q66 120 86 104 Z" />
        <Path d="M142 88 Q168 100 170 168 Q172 210 176 244 L162 244 Q156 210 156 168 Q154 120 134 104 Z" />
        {/* Jambes */}
        <Path d="M88 210 Q84 280 88 320 Q90 380 90 420 L104 420 Q106 360 108 320 Q110 260 108 214 Z" />
        <Path d="M132 210 Q136 280 132 320 Q130 380 130 420 L116 420 Q114 360 112 320 Q110 260 112 214 Z" />
        {/* Pieds */}
        <Path d="M84 420 L100 420 L102 444 Q92 450 82 444 Z" />
        <Path d="M120 420 L136 420 L138 444 Q128 450 118 444 Z" />
      </G>

      {/* Zones tapables */}
      {Object.entries(ZONES).map(([category, spots]) => {
        const isAvail = available.has(category);
        if (!isAvail) return null;
        const isSel = selected === category;
        return (
          <G key={category}>
            {spots.map((sp, i) => (
              <Circle
                key={i}
                cx={sp.cx}
                cy={sp.cy}
                r={sp.r}
                fill={isSel ? BRAND : dark ? 'rgba(96,165,250,0.35)' : 'rgba(37,99,235,0.25)'}
                stroke={isSel ? '#fff' : BRAND}
                strokeWidth={isSel ? 2 : 1.5}
                onPress={() => onSelect(category)}
              />
            ))}
          </G>
        );
      })}
    </Svg>
  );
}

/** Libellé lisible d'une catégorie (les valeurs DB sont déjà propres). */
export const NON_BODY_CATEGORIES = ['Neurologique', 'Vasculaire', 'Systémique'];
