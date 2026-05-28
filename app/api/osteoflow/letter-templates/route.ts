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
    id: 'attestation_consultation',
    name: 'Attestation de consultation',
    description: 'Attester la présence du patient en consultation, sans contenu médical',
    category: 'attestation',
    icon: 'file-check',
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
