import { createMiddlewareClient } from '@/lib/supabase-server-helpers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ['/dashboard', '/settings', '/admin', '/trees', '/tests']
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Redirect to dashboard if logged in and trying to access login page
  if (session && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Admin routes protection
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  // `f/` (pages funnel) est exclu : ces pages sont publiques par définition et
  // rendues côté serveur avec la clé service-role. Les faire passer par le
  // middleware ajouterait une lecture de session Supabase à chaque visite,
  // sur précisément les pages où la vitesse d'affichage se paie en
  // conversions.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|f/).*)'],
}
