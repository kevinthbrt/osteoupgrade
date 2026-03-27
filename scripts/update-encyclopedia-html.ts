/**
 * Script one-shot : met à jour le content_html des entrées 1.1 Cours et 1.2 Outils
 * Utilisation :
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx ts-node -e "require('./scripts/update-encyclopedia-html.ts')"
 *
 * Ou plus simplement si .env.local est présent :
 *   npx ts-node scripts/update-encyclopedia-html.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const entries = [
  {
    id: '21254a56-347a-4e35-8a12-3e6038674b66',
    file: '/tmp/cours_modified.html',
    label: 'Chapitre 1.1 - Cours',
  },
  {
    id: 'ff08f1c0-49ee-4be1-b8fd-121de196f0e8',
    file: '/tmp/outils_modified.html',
    label: 'Chapitre 1.2 - Outils',
  },
]

async function main() {
  for (const entry of entries) {
    console.log(`Updating ${entry.label}...`)
    const html = fs.readFileSync(entry.file, 'utf-8')
    const { error } = await supabase
      .from('encyclopedia_entries')
      .update({ content_html: html })
      .eq('id', entry.id)
    if (error) {
      console.error(`  ✗ Error:`, error.message)
    } else {
      console.log(`  ✓ Done (${html.length} chars)`)
    }
  }
}

main()
