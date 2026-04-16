import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function DELETE(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
    }

    await supabaseAdmin.from('osteoflow_sessions').delete().eq('token', token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[osteoflow/logout] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
