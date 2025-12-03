'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Activity,
  Filter,
  Map,
  Box,
  TestTube,
  Stethoscope,
  Calendar
} from 'lucide-react'

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
          // Fallback en mode démo quand l'utilisateur n'est pas authentifié
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

  const menuItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: Home },
    {
      href: '/topographie',
      label: 'Topographie',
      icon: BookOpen,
      badge: 'Premium',
      roles: ['premium', 'admin']
    },
    {
      href: '/testing',
      label: 'Testing 3D',
      icon: TestTube,
      isNew: true,
      badge: 'Premium',
      roles: ['premium', 'admin']
    },
    {
      href: '/consultation-v3',
      label: 'Consultation guidée',
      icon: Map,
      badge: 'Bientôt',
      roles: ['admin']
    },
    {
      href: '/seminaires',
      label: 'Séminaires présentiels',
      icon: Calendar,
      badge: 'Premium',
      roles: ['premium', 'admin']
    },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ]

  const adminItems = [
    { href: '/admin', label: 'Vue d\'ensemble', icon: Shield },
    { href: '/admin/users', label: 'Utilisateurs', icon: Users },
    {
      href: '/tests',
      label: 'Tests Orthopédiques',
      icon: Clipboard,
      description: 'Tests par zones'
    },
    { 
      href: '/admin/pathologies', 
      label: 'Pathologies', 
      icon: Activity,
      description: 'Diagnostics simples'
    },
    { 
      href: '/admin/topographic-zones', 
      label: 'Zones Topographiques', 
      icon: Map,
      description: 'Pour Consultation V3',
      badge: 'V3'
    },
    { 
      href: '/admin/decision-trees', 
      label: 'Arbres Décisionnels', 
      icon: Filter,
      description: 'Pour Consultation V3',
      badge: 'V3'
    },
    { 
      href: '/admin/anatomy-builder', 
      label: 'Anatomy Builder', 
      icon: Box,
      description: 'Zones 3D Testing',
      badge: '3D'
    },
  ]

  const getRoleBadge = () => {
    if (!profile) return null
    
    const badges = {
      free: { text: 'Gratuit', bg: 'bg-gray-100', color: 'text-gray-700' },
      premium: { text: 'Premium', bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', color: 'text-white' },
      admin: { text: 'Admin', bg: 'bg-gradient-to-r from-purple-500 to-purple-600', color: 'text-white' }
    }
    
    const badge = badges[profile.role as keyof typeof badges]
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color} flex items-center gap-1`}>
        {profile.role === 'premium' && <Crown className="h-3 w-3" />}
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } w-72 lg:w-64`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">OsteoUpgrade</h2>
                <p className="text-xs text-gray-500">L'application pour les thérapeutes 2.0</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  } ${isRestricted ? 'opacity-60 cursor-not-allowed hover:bg-white hover:text-gray-700' : ''}`}
                  onClick={() => {
                    if (!isRestricted) {
                      setIsOpen(false)
                    } else if (profile?.role === 'free') {
                      alert('Cette section est réservée aux membres Premium')
                    } else {
                      alert('Accès réservé aux administrateurs pendant la phase de pré-lancement')
                    }
                  }}
                >
                  <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-semibold rounded">
                      {item.badge}
                    </span>
                  )}
                  {item.isNew && (
                    <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded">
                      NEW
                    </span>
                  )}
                </Link>
              )
            })}

            {profile?.role === 'admin' && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administration
                  </p>
                </div>
                {adminItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex flex-col px-3 py-2.5 rounded-lg transition-all group ${
                        isActive
                          ? 'bg-purple-50 text-purple-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center w-full">
                        <Icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                            item.badge === 'V3' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="h-4 w-4 ml-2" />}
                      </div>
                      {item.description && !isActive && (
                        <p className="text-[10px] text-gray-500 ml-8 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all group"
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-500" />
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