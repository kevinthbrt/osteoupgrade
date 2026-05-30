'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Home,
  BookOpen,
  Clipboard,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Crown,
  Stethoscope,
  FileText,
  Gift,
  Map,
  GraduationCap,
  Zap,
  Calendar,
  Dumbbell,
  LogIn,
} from 'lucide-react'
import AdminNotificationBell from './AdminNotificationBell'
import UserNotificationBell from './UserNotificationBell'

type MenuItem = {
  href: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  roles?: string[]
  badge?: string
  isNew?: boolean
  hideWhenRestricted?: boolean
}

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('/api/profile', { cache: 'no-store' })
        if (!response.ok) {
          setProfile({ role: 'free', full_name: 'Invité' })
          setUser(null)
          setProfileError('Profil introuvable')
          return
        }

        const payload = await response.json()
        setUser(payload.user)
        setProfile(payload.profile ?? { role: 'free', full_name: 'Invité' })
      } catch (error) {
        console.error('Erreur de récupération du profil:', error)
        setProfile({ role: 'free', full_name: 'Invité' })
        setProfileError('Erreur de récupération du profil')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const menuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/elearning/cours', label: 'Cours', icon: BookOpen },
    { href: '/pratique', label: 'Pratique', icon: Stethoscope },
    { href: '/elearning/revue-litterature', label: 'Revue OsteoUpgrade', icon: FileText },
    { href: '/tests', label: 'Tests ortho', icon: Clipboard },
    { href: '/topographie', label: 'Topographie', icon: Map },
    { href: '/parrainage', label: 'Parrainage & Cagnotte', icon: Gift },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ]

  const getRoleBadge = () => {
    if (!profile) return null

    const badges = {
      free: { text: 'Gratuit', bg: 'bg-gray-100', color: 'text-gray-700' },
      premium: { text: 'Premium', bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', color: 'text-white' },
      admin: { text: 'Admin', bg: 'bg-gradient-to-r from-purple-500 to-purple-600', color: 'text-white' }
    }

    const badge = badges[profile.role as keyof typeof badges] || badges.free

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color} flex items-center gap-1`}>
        {profile.role === 'premium' && <Crown className="h-3 w-3" />}
        {profile.role === 'admin' && <Shield className="h-3 w-3" />}
        {badge.text}
      </span>
    )
  }

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon
    const isActive = pathname === item.href
    const isRestricted = item.roles && profile && !item.roles.includes(profile.role)
    const shouldHide = isRestricted && item.hideWhenRestricted

    if (shouldHide) return null
    if (item.roles && !profile?.role) return null

    return (
      <Link
        key={item.href}
        href={isRestricted ? '#' : item.href}
        className={`flex items-center px-3 py-2.5 rounded-xl transition-all group relative ${
          isActive
            ? 'bg-sky-500/20 backdrop-blur-sm text-white font-medium shadow-sm border border-sky-400/20 ring-1 ring-inset ring-white/10'
            : 'text-slate-300 border border-transparent hover:bg-white/10 hover:backdrop-blur-sm hover:border-white/15 hover:shadow-sm hover:text-white'
        } ${isRestricted ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent hover:shadow-none hover:text-slate-300' : ''}`}
        onClick={() => {
          if (!isRestricted) {
            setIsOpen(false)
          } else if (profile?.role === 'free') {
            alert('Cette section est réservée aux membres Premium')
          } else {
            alert('Accès réservé aux administrateurs')
          }
        }}
      >
        <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-sky-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
        <span className="flex-1">{item.label}</span>
        {isActive && <ChevronRight className="h-4 w-4 text-sky-300" />}
        {item.badge && (
          <span className="ml-2 px-1.5 py-0.5 bg-white/10 text-slate-200 text-[10px] font-semibold rounded">
            {item.badge}
          </span>
        )}
        {item.isNew && (
          <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold rounded">
            NEW
          </span>
        )}
      </Link>
    )
  }

  if (loading) {
    return null
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-blue-900/50 hover:bg-blue-950 transition-all"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 border-r border-blue-900/50 transition-transform duration-300 z-40 overflow-hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } w-72 lg:w-64`}>
        {/* Ambient blobs */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none -translate-x-1/2 -translate-y-1/4" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-1/4 right-0 w-40 h-40 bg-cyan-400/8 rounded-full blur-3xl animate-pulse pointer-events-none translate-x-1/3" style={{ animationDuration: '7s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-indigo-500/8 rounded-full blur-2xl animate-pulse pointer-events-none -translate-x-1/2 -translate-y-1/2" style={{ animationDuration: '4s', animationDelay: '1s' }} />

        <div className="flex flex-col h-full relative">
          {/* Logo */}
          <div className="p-6 border-b border-blue-900/50">
            <div className="flex items-center justify-center space-x-3">
              <div className="flex items-center justify-center">
                <Image
                  src="/logo.svg"
                  alt="OsteoUpgrade Logo"
                  width={96}
                  height={96}
                  className="h-24 w-24 object-contain"
                  style={{ objectPosition: 'center' }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">OsteoUpgrade</h2>
                <p className="text-xs text-slate-300">L'enseignement hybride</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="px-4 py-4 border-b border-blue-900/50">
            <div className="rounded-xl bg-white/5 backdrop-blur-md border border-white/10 ring-1 ring-inset ring-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-blue-300/70 truncate">{user?.email}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <UserNotificationBell />
                  {getRoleBadge()}
                </div>
              </div>
              {profileError && (
                <p className="mt-2 text-[11px] text-amber-200">
                  {profileError}
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map(renderMenuItem)}

            {profile?.role === 'admin' && (
              <>
                <div className="pt-4 pb-2">
                  <div className="px-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Administration
                    </p>
                    <AdminNotificationBell />
                  </div>
                </div>

                <Link
                  href="/admin"
                  className={`flex items-center px-3 py-2.5 rounded-xl transition-all group ${
                    pathname === '/admin' || pathname.startsWith('/admin/')
                      ? 'bg-purple-500/20 backdrop-blur-sm text-white font-medium border border-purple-400/20 ring-1 ring-inset ring-white/10'
                      : 'text-slate-300 border border-transparent hover:bg-white/10 hover:backdrop-blur-sm hover:border-white/15 hover:shadow-sm hover:text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Shield className={`h-5 w-5 mr-3 ${pathname === '/admin' || pathname.startsWith('/admin/') ? 'text-purple-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="flex-1">Administration</span>
                  {(pathname === '/admin' || pathname.startsWith('/admin/')) && <ChevronRight className="h-4 w-4 text-purple-300" />}
                </Link>
              </>
            )}
          </nav>

          {/* Premium CTA for free users */}
          {profile?.role === 'free' && (
            <div className="px-4 pb-2">
              <Link
                href="/settings/subscription"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-sm text-yellow-900 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 shadow-lg border border-yellow-300 transition-all animate-pulse"
              >
                <Crown className="h-5 w-5 shrink-0" />
                <span className="flex-1">Passer Premium</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          )}

          {/* Logout button + Legal links */}
          <div className="p-4 border-t border-blue-900/50 space-y-3">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-slate-300 rounded-xl border border-transparent hover:bg-red-500/15 hover:backdrop-blur-sm hover:border-red-400/20 hover:shadow-sm hover:text-red-300 transition-all group"
            >
              <LogOut className="h-5 w-5 mr-3 text-slate-400 group-hover:text-red-400" />
              <span>Déconnexion</span>
            </button>
            <div className="flex gap-3 flex-wrap px-1">
              <Link href="/mentions-legales" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">Mentions légales</Link>
              <Link href="/cgu" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">CGU</Link>
              <Link href="/politique-confidentialite" className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
