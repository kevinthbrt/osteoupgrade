/**
 * Régions anatomiques du module Topographie — identiques au web
 * (app/topographie/page.tsx : BODY_REGIONS / REGION_LABELS).
 */
export const TOPO_CATEGORIES: Record<string, string[]> = {
  'Tête et Cou': ['cervical', 'atm', 'crane'],
  'Membre Supérieur': ['epaule', 'coude', 'poignet'],
  Tronc: ['thoracique', 'lombaire', 'sacro-iliaque', 'cotes'],
  'Membre Inférieur': ['hanche', 'genou', 'cheville', 'pied'],
  Général: ['neurologique', 'vasculaire', 'systemique'],
};

export const TOPO_REGION_LABELS: Record<string, string> = {
  cervical: 'Cervical',
  atm: 'ATM',
  crane: 'Crâne',
  thoracique: 'Thoracique',
  lombaire: 'Lombaire',
  'sacro-iliaque': 'Sacro-iliaque',
  cotes: 'Côtes',
  epaule: 'Épaule',
  coude: 'Coude',
  poignet: 'Poignet + main',
  hanche: 'Hanche',
  genou: 'Genou',
  cheville: 'Cheville',
  pied: 'Pied',
  neurologique: 'Neurologique',
  vasculaire: 'Vasculaire',
  systemique: 'Systémique',
};

export function topoRegionLabel(region: string): string {
  return TOPO_REGION_LABELS[region] ?? region;
}
