import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const LETTER_TEMPLATES = [
  {
    id: 'referral',
    name: "Courrier d'adressage",
    description: 'Adresser un patient à un confrère médecin, spécialiste ou professionnel de santé',
    category: 'consultation',
    icon: 'send',
  },
  {
    id: 'compte_rendu',
    name: 'Compte-rendu de consultation',
    description: 'CR structuré pour le médecin traitant ou le dossier patient',
    category: 'consultation',
    icon: 'file-text',
  },
  {
    id: 'certificat_suivi',
    name: 'Attestation de suivi ostéopathique',
    description: "Certifier le suivi ostéopathique d'un patient",
    category: 'attestation',
    icon: 'award',
  },
  {
    id: 'recommandation_repos',
    name: 'Recommandation de repos sportif',
    description: "Recommander une limitation ou un arrêt temporaire d'activité physique",
    category: 'attestation',
    icon: 'activity',
  },
]

export async function GET(req: Request) {
  const authHeader = req.headers.get('x-osteoflow-secret')
  const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
  if (!expectedSecret || authHeader !== expectedSecret) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  return NextResponse.json({ templates: LETTER_TEMPLATES })
}
