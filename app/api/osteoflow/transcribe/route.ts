import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const dynamic = 'force-dynamic'
// Plan Pro (jusqu'à 300s) — relevé de 30s pour couvrir la transcription
// d'anamnèses plus longues (limite d'enregistrement portée à 13 min).
export const maxDuration = 100

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-osteoflow-secret')
    const expectedSecret = process.env.OSTEOFLOW_PROXY_SECRET
    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const formData = await req.formData() as unknown as FormData
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Fichier audio manquant' }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API Groq non configurée' }, { status: 500 })
    }

    const groq = new Groq({ apiKey })
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo',
      language: 'fr',
      response_format: 'text',
    })

    return NextResponse.json({ transcript: transcription })
  } catch (err) {
    console.error('[transcribe proxy]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
