import { supabaseAdmin } from './supabase-server'

type NotifType = 'bug_report' | 'new_subscription' | 'referral' | 'other'

export async function notifyAdmin(type: NotifType, title: string, body?: string) {
  try {
    await supabaseAdmin.from('admin_notifications').insert({ type, title, body: body ?? null })
  } catch (err) {
    console.error('notifyAdmin failed:', err)
  }
}
