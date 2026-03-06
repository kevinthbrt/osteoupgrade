'use client'

import { useState } from 'react'
import type { AnatomicalRegion } from '@/lib/types-topographic-system'

interface BodyModel2DProps {
  selectedRegion: AnatomicalRegion | null
  onRegionSelect: (region: AnatomicalRegion) => void
}

const REGION_LABELS: Record<AnatomicalRegion, string> = {
  cervical: 'Cervical',
  atm: 'ATM',
  crane: 'Crane',
  thoracique: 'Thoracique',
  lombaire: 'Lombaire',
  'sacro-iliaque': 'Sacro-iliaque',
  cotes: 'Cotes',
  epaule: 'Epaule',
  coude: 'Coude',
  poignet: 'Poignet + main',
  hanche: 'Hanche',
  genou: 'Genou',
  cheville: 'Cheville',
  pied: 'Pied',
  neurologique: 'Neurologique',
  vasculaire: 'Vasculaire',
  systemique: 'Systemique'
}

// Each region mapped to an SVG path/shape on a 400x700 viewBox body silhouette
// The body is drawn as a simplified anterior view
const BODY_REGIONS_MAP: {
  region: AnatomicalRegion
  label: string
  path: string
  labelPos: { x: number; y: number }
}[] = [
  {
    region: 'crane',
    label: 'Crane',
    path: 'M175,30 Q175,10 200,10 Q225,10 225,30 Q225,55 200,60 Q175,55 175,30Z',
    labelPos: { x: 200, y: 35 }
  },
  {
    region: 'atm',
    label: 'ATM',
    path: 'M172,38 Q165,38 165,45 Q165,52 172,52 Q175,52 175,45 Q175,38 172,38Z M228,38 Q235,38 235,45 Q235,52 228,52 Q225,52 225,45 Q225,38 228,38Z',
    labelPos: { x: 200, y: 48 }
  },
  {
    region: 'cervical',
    label: 'Cervical',
    path: 'M188,60 L212,60 L215,85 L185,85Z',
    labelPos: { x: 200, y: 75 }
  },
  {
    region: 'epaule',
    label: 'Epaule',
    path: 'M140,88 Q130,85 125,95 Q120,108 130,115 L155,110 L155,88Z M245,88 L260,88 Q270,85 275,95 Q280,108 270,115 L245,110Z',
    labelPos: { x: 200, y: 100 }
  },
  {
    region: 'thoracique',
    label: 'Thoracique',
    path: 'M155,88 L245,88 L245,140 L155,140Z',
    labelPos: { x: 200, y: 115 }
  },
  {
    region: 'cotes',
    label: 'Cotes',
    path: 'M155,140 L245,140 L250,165 L150,165Z',
    labelPos: { x: 200, y: 153 }
  },
  {
    region: 'lombaire',
    label: 'Lombaire',
    path: 'M150,165 L250,165 L248,205 L152,205Z',
    labelPos: { x: 200, y: 185 }
  },
  {
    region: 'sacro-iliaque',
    label: 'Sacro-iliaque',
    path: 'M152,205 L248,205 L245,230 L155,230Z',
    labelPos: { x: 200, y: 218 }
  },
  {
    region: 'coude',
    label: 'Coude',
    path: 'M100,175 Q95,165 90,175 Q85,190 92,195 L108,195 Q115,190 110,175Z M290,175 Q295,165 300,175 Q305,190 298,195 L282,195 Q275,190 280,175Z',
    labelPos: { x: 200, y: 185 }
  },
  {
    region: 'poignet',
    label: 'Poignet',
    path: 'M80,235 Q75,225 72,235 Q68,250 75,260 L95,260 Q100,250 97,240Z M305,235 Q310,225 313,235 Q317,250 310,260 L290,260 Q285,250 288,240Z',
    labelPos: { x: 200, y: 248 }
  },
  {
    region: 'hanche',
    label: 'Hanche',
    path: 'M155,230 L195,230 L185,275 L145,275Z M205,230 L245,230 L255,275 L215,275Z',
    labelPos: { x: 200, y: 253 }
  },
  {
    region: 'genou',
    label: 'Genou',
    path: 'M150,365 Q145,355 148,365 Q145,385 152,390 L178,390 Q185,385 182,370 Q185,360 180,355Z M220,365 Q215,355 218,365 Q215,385 222,390 L248,390 Q255,385 252,370 Q255,360 250,355Z',
    labelPos: { x: 200, y: 375 }
  },
  {
    region: 'cheville',
    label: 'Cheville',
    path: 'M152,485 Q148,475 150,485 Q148,500 155,505 L175,505 Q182,500 180,490 Q182,480 178,475Z M222,485 Q218,475 220,485 Q218,500 225,505 L245,505 Q252,500 250,490 Q252,480 248,475Z',
    labelPos: { x: 200, y: 495 }
  },
  {
    region: 'pied',
    label: 'Pied',
    path: 'M148,505 L180,505 L185,530 Q185,540 165,545 Q145,540 143,530Z M220,505 L252,505 L257,530 Q257,540 237,545 Q217,540 215,530Z',
    labelPos: { x: 200, y: 525 }
  }
]

// Background body silhouette for visual context
const BODY_SILHOUETTE = `
  M200,10
  Q230,10 230,35 Q230,60 215,65
  L218,85
  Q260,82 280,100 Q295,115 300,140
  L310,175
  Q315,195 305,210
  L315,240
  Q320,260 310,270 L305,275
  Q295,260 290,260
  L280,235
  Q275,210 270,195
  L255,160
  L250,230
  Q260,250 260,280
  L258,340
  Q260,360 255,390
  L252,430
  Q255,460 252,490
  Q255,510 260,530
  Q260,545 240,550
  Q220,545 218,535
  L215,510
  Q215,500 218,480
  L220,430
  Q222,400 220,370
  L215,310
  Q212,290 200,280
  Q188,290 185,310
  L180,370
  Q178,400 180,430
  L182,480
  Q185,500 185,510
  L182,535
  Q180,545 160,550
  Q140,545 140,530
  Q145,510 148,490
  Q145,460 148,430
  L145,390
  Q140,360 142,340
  L140,280
  Q140,250 150,230
  L145,160
  L130,195
  Q125,210 120,235
  L110,260
  Q105,260 95,275
  L90,270
  Q80,260 85,240
  L90,210
  Q85,195 90,175
  L100,140
  Q105,115 120,100
  Q140,82 182,85
  L185,65
  Q170,60 170,35 Q170,10 200,10Z
`

// "General" regions shown as buttons below the body
const GENERAL_REGIONS: { region: AnatomicalRegion; label: string }[] = [
  { region: 'neurologique', label: 'Neurologique' },
  { region: 'vasculaire', label: 'Vasculaire' },
  { region: 'systemique', label: 'Systemique' }
]

export default function BodyModel2D({ selectedRegion, onRegionSelect }: BodyModel2DProps) {
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegion | null>(null)

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox="60 0 280 560"
        className="w-full max-w-[320px] h-auto select-none"
        role="img"
        aria-label="Modele anatomique 2D - cliquez sur une region"
      >
        {/* Body silhouette background */}
        <path
          d={BODY_SILHOUETTE}
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Clickable regions */}
        {BODY_REGIONS_MAP.map(({ region, path }) => {
          const isSelected = selectedRegion === region
          const isHovered = hoveredRegion === region

          return (
            <path
              key={region}
              d={path}
              fill={
                isSelected
                  ? 'rgba(225, 29, 72, 0.5)'
                  : isHovered
                  ? 'rgba(225, 29, 72, 0.25)'
                  : 'rgba(99, 102, 241, 0.15)'
              }
              stroke={
                isSelected
                  ? '#e11d48'
                  : isHovered
                  ? '#f43f5e'
                  : '#818cf8'
              }
              strokeWidth={isSelected || isHovered ? 2 : 1}
              className="cursor-pointer transition-all duration-200"
              onClick={() => onRegionSelect(region)}
              onMouseEnter={() => setHoveredRegion(region)}
              onMouseLeave={() => setHoveredRegion(null)}
            >
              <title>{REGION_LABELS[region]}</title>
            </path>
          )
        })}
      </svg>

      {/* Tooltip for hovered region */}
      {hoveredRegion && (
        <div className="text-sm font-semibold text-slate-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-200 -mt-2">
          {REGION_LABELS[hoveredRegion]}
        </div>
      )}

      {/* General regions as buttons below */}
      <div className="w-full">
        <p className="text-xs text-slate-500 font-medium mb-2 text-center">General</p>
        <div className="flex gap-2 justify-center">
          {GENERAL_REGIONS.map(({ region, label }) => (
            <button
              key={region}
              onClick={() => onRegionSelect(region)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${
                selectedRegion === region
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
