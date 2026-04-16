import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export async function DELETE(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400, headers: CORS })
    }

    await supabaseAdmin.from('osteoflow_sessions').delete().eq('token', token)

    return NextResponse.json({ success: true }, { headers: CORS })
  } catch (error) {
    console.error('[osteoflow/logout] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500, headers: CORS })
  }
}
