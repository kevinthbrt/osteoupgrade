'use client'

import { usePathname, useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { BookOpen, Stethoscope, GraduationCap, Home } from 'lucide-react'

export default function EncyclopediaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const navigation = [
    {
      name: 'Accueil Encyclopédie',
      href: '/encyclopedia',
      icon: Home,
      current: pathname === '/encyclopedia'
    },
    {
      name: 'Pratique',
      href: '/encyclopedia/practice',
      icon: Stethoscope,
      current: pathname?.startsWith('/encyclopedia/practice')
    },
    {
      name: 'Diagnostic',
      href: '/encyclopedia/diagnostics',
      icon: BookOpen,
      current: pathname?.startsWith('/encyclopedia/diagnostics')
    },
    {
      name: 'E-Learning',
      href: '/encyclopedia/learning',
      icon: GraduationCap,
      current: pathname?.startsWith('/encyclopedia/learning')
    }
  ]

  return (
    <AuthLayout>
      <div className="min-h-screen">
        {/* Encyclopedia Navigation */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
          <div className="flex flex-wrap gap-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    item.current
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </AuthLayout>
  )
}
