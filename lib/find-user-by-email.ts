import { supabaseAdmin } from './supabase-server'

export async function findUserByEmail(email: string) {
  let page = 1
  const perPage = 1000
  while (true) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    const users = data?.users ?? []
    const found = users.find((u) => u.email === email)
    if (found) return found
    if (users.length < perPage) return null
    page++
  }
}
