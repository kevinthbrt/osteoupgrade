import { createClient } from '@supabase/supabase-js'
import { extractVimeoId, fetchVimeoOEmbedMetadata } from '../lib/vimeo'

type PracticeVideoRow = {
  id: string
  vimeo_url: string | null
  vimeo_id: string | null
  thumbnail_url: string | null
  duration_seconds: number | null
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const tableName = process.env.VIMEO_BACKFILL_TABLE || 'practice_videos'

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY environment variables')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function run() {
  let from = 0
  const batchSize = 200
  let updated = 0
  let skipped = 0

  console.log(`Starting Vimeo metadata backfill for table: ${tableName}`)

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id,vimeo_url,vimeo_id,thumbnail_url,duration_seconds')
      .order('created_at', { ascending: true })
      .range(from, from + batchSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    const rows = data as PracticeVideoRow[]

    for (const row of rows) {
      const needsBackfill = !row.vimeo_id || !row.thumbnail_url || row.duration_seconds == null
      if (!needsBackfill) {
        skipped += 1
        continue
      }

      if (!row.vimeo_url) {
        skipped += 1
        continue
      }

      try {
        const metadata = await fetchVimeoOEmbedMetadata(row.vimeo_url)
        const fallbackId = extractVimeoId(row.vimeo_url)

        const patch = {
          vimeo_id: row.vimeo_id || metadata.vimeo_id || fallbackId,
          thumbnail_url: row.thumbnail_url || metadata.thumbnail_url,
          duration_seconds: row.duration_seconds ?? metadata.duration_seconds,
        }

        const { error: updateError } = await supabase
          .from(tableName)
          .update(patch)
          .eq('id', row.id)

        if (updateError) throw updateError

        updated += 1
        console.log(`✓ Updated video ${row.id}`)
      } catch (error) {
        console.warn(`⚠ Failed for ${row.id}:`, error)
      }

      await sleep(150)
    }

    from += batchSize
  }

  console.log(`Backfill complete. Updated=${updated}, Skipped=${skipped}`)
}

run().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
