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
  Users,
  ChevronRight,
  Crown,
  TestTube,
  Stethoscope,
  Wrench,
  Calendar,
  Mail,
  GraduationCap,
  FileQuestion,
  Target,
  FolderOpen
} from 'lucide-react'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          setProfile(profile)
        } else {
          setProfile({ role: 'free', full_name: 'Invité' })
        }
      } catch (error) {
        console.error('Erreur de récupération du profil:', error)
        setProfile({ role: 'free', full_name: 'Invité' })
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
    {
      href: '/elearning',
      label: 'E-Learning',
      icon: GraduationCap,
      badge: 'Hub',
      roles: ['premium_silver', 'premium_gold', 'admin']
    },
    {
      href: '/pratique',
      label: 'Pratique',
      icon: Stethoscope,
      badge: 'Premium',
      roles: ['premium_silver', 'premium_gold', 'admin']
    },
    {
      href: '/outils',
      label: 'Outils',
      icon: Wrench,
      badge: 'Premium',
      roles: ['premium_silver', 'premium_gold', 'admin']
    },
    {
      href: '/seminaires',
      label: 'Séminaires',
      icon: Calendar,
      badge: 'Gold',
      roles: ['premium_gold', 'admin']
    },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ]

  const adminOverviewItem: MenuItem = { href: '/admin', label: "Administration", icon: Shield }

  const adminGroups: { id: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; items: MenuItem[] }[] = [
    {
      id: 'elearning',
      label: 'E-Learning',
      icon: GraduationCap,
      items: [
        {
          href: '/elearning/cours',
          label: 'Cours',
          icon: BookOpen
        },
        {
          href: '/encyclopedia/learning/quizzes',
          label: 'Quiz',
          icon: FileQuestion,
          badge: 'Nouveau'
        },
        {
          href: '/encyclopedia/learning/cases',
          label: 'Cas Pratiques',
          icon: Target,
          badge: 'Nouveau'
        }
      ]
    },
    {
      id: 'tests',
      label: 'Tests & Diagnostics',
      icon: Clipboard,
      items: [
        {
          href: '/admin/diagnostics',
          label: 'Diagnostics',
          icon: FolderOpen
        },
        {
          href: '/topographie',
          label: 'Topographie',
          icon: BookOpen
        }
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: Mail,
      items: [
        {
          href: '/admin/mailing',
          label: 'Mailing',
          icon: Mail
        }
      ]
    }
  ]

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {}
    adminGroups.forEach(group => {
      initialState[group.id] = group.items.some(item => item.href === pathname)
    })
    return initialState
  })

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const getRoleBadge = () => {
    if (!profile) return null

    const badges = {
      free: { text: 'Gratuit', bg: 'bg-gray-100', color: 'text-gray-700' },
      premium: { text: 'Premium', bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', color: 'text-white' },
      premium_silver: { text: 'Silver', bg: 'bg-gradient-to-r from-gray-300 to-gray-400', color: 'text-white' },
      premium_gold: { text: 'Gold', bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', color: 'text-white' },
      admin: { text: 'Admin', bg: 'bg-gradient-to-r from-purple-500 to-purple-600', color: 'text-white' }
    }

    const badge = badges[profile.role as keyof typeof badges] || badges.free

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color} flex items-center gap-1`}>
        {(profile.role === 'premium' || profile.role === 'premium_silver' || profile.role === 'premium_gold') && <Crown className="h-3 w-3" />}
        {profile.role === 'admin' && <Shield className="h-3 w-3" />}
        {badge.text}
      </span>
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-white/10 hover:bg-slate-800 transition-all"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 border-r border-white/10 transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } w-72 lg:w-64`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
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
                <p className="text-xs text-slate-300">Plateforme V2</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              {getRoleBadge()}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
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
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all group relative ${
                    isActive
                      ? 'bg-sky-500/20 text-white font-medium shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  } ${isRestricted ? 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-slate-300' : ''}`}
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
            })}

            {profile?.role === 'admin' && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Administration
                  </p>
                </div>

                {(() => {
                  const Icon = adminOverviewItem.icon
                  const isActive = pathname === adminOverviewItem.href
                  return (
                    <Link
                      key={adminOverviewItem.href}
                      href={adminOverviewItem.href}
                      className={`flex items-center px-3 py-2.5 rounded-lg transition-all group ${
                        isActive
                          ? 'bg-purple-500/20 text-white font-medium shadow-sm'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-purple-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span className="flex-1">{adminOverviewItem.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-purple-300" />}
                    </Link>
                  )
                })()}

                {adminGroups.map((group) => {
                  const GroupIcon = group.icon
                  const isGroupActive = group.items.some(item => pathname === item.href)
                  const isExpanded = expandedGroups[group.id] ?? isGroupActive

                  return (
                    <div key={group.id} className="px-1">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className={`flex items-center w-full px-2 py-2 rounded-lg transition-all ${
                          isGroupActive
                            ? 'bg-purple-500/20 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <GroupIcon className={`h-5 w-5 mr-3 ${isGroupActive ? 'text-purple-300' : 'text-slate-400'}`} />
                        <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90 text-purple-300' : 'text-slate-400'}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-1 space-y-1 ml-2">
                          {group.items.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-2 rounded-lg transition-all group ${
                                  isActive
                                    ? 'bg-purple-500/20 text-white font-medium shadow-sm'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                                onClick={() => setIsOpen(false)}
                              >
                                <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-purple-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
                                <span className="flex-1 text-sm">{item.label}</span>
                                {item.badge && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold rounded">
                                    {item.badge}
                                  </span>
                                )}
                                {isActive && <ChevronRight className="h-3 w-3 text-purple-300" />}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                <Link
                  href="/admin/users"
                  className={`flex items-center px-3 py-2.5 rounded-lg transition-all group ${
                    pathname === '/admin/users'
                      ? 'bg-purple-500/20 text-white font-medium shadow-sm'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Users className={`h-5 w-5 mr-3 ${pathname === '/admin/users' ? 'text-purple-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="flex-1">Utilisateurs</span>
                  {pathname === '/admin/users' && <ChevronRight className="h-4 w-4 text-purple-300" />}
                </Link>
              </>
            )}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-slate-300 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-all group"
            >
              <LogOut className="h-5 w-5 mr-3 text-slate-400 group-hover:text-red-400" />
              <span>Déconnexion</span>
            </button>
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
