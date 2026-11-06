import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-guards'
import { reclassifyExisting } from '@/lib/inbox'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** POST /api/admin/inbox/reclassify : réapplique règles et heuristiques au courrier existant. */
export async function POST() {
  if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json(await reclassifyExisting())
}
