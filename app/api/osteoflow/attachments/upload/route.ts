import { NextResponse } from 'next/server'
import { getAppDataDir } from '@/lib/osteoflow/database/connection'
import { createLocalClient } from '@/lib/osteoflow/database/server-query-builder'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const MAX_FILE_SIZE = 20 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { file: base64Data, consultation_id, original_name, mimetype } = body as {
      file?: string; consultation_id?: string; original_name?: string; mimetype?: string
    }

    if (!base64Data || !consultation_id || !original_name) {
      return NextResponse.json({ error: 'Fichier, consultation_id et original_name requis' }, { status: 400 })
    }

    const base64 = base64Data.replace(/^data:[^;]+;base64,/, '')
    const buffer = Buffer.from(base64, 'base64')

    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Le fichier ne doit pas dépasser 20 Mo' }, { status: 400 })
    }

    const ext = path.extname(original_name).toLowerCase() || '.bin'
    const uniqueId = crypto.randomBytes(8).toString('hex')
    const filename = `${consultation_id}_${uniqueId}${ext}`

    const attachmentsDir = path.join(getAppDataDir(), 'attachments')
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true })
    }

    const filePath = path.join(attachmentsDir, filename)
    fs.writeFileSync(filePath, buffer)

    const client = createLocalClient()
    const { data: attachment, error } = await client
      .from('consultation_attachments')
      .insert({ consultation_id, filename, original_name, mime_type: mimetype || 'application/octet-stream', file_size: buffer.length })
      .select()
      .single()

    if (error) {
      fs.unlinkSync(filePath)
      throw error
    }

    return NextResponse.json({ attachment })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
