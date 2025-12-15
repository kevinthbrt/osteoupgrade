'use client'

import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, UserCog } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAdminView } from './AdminViewContext'

const OPTIONS = [
  { value: null, label: 'Vue admin', description: 'Affichage complet' },
  { value: 'free', label: 'Vue Free', description: 'Restrictions gratuites' },
  { value: 'premium_silver', label: 'Vue Premium Silver', description: 'Avantages Silver' },
  { value: 'premium_gold', label: 'Vue Premium Gold', description: 'Avantages Gold' }
] as const

type OptionValue = (typeof OPTIONS)[number]['value']

export function AdminViewSwitcher() {
  const { viewRole, setViewRole } = useAdminView()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setIsAdmin(profile?.role === 'admin')
      } catch (error) {
        console.error('Erreur vérification admin view:', error)
      }
    }

    checkAdmin()
  }, [])

  const activeLabel = useMemo(() => {
    const active = OPTIONS.find(option => option.value === viewRole)
    return active?.label ?? 'Vue admin'
  }, [viewRole])

  if (!isAdmin) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white shadow-lg rounded-xl border border-slate-200/70 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="w-full px-4 py-3 flex items-center gap-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
        >
          <UserCog className="h-5 w-5 text-purple-600" />
          <div className="flex flex-col text-left">
            <span className="leading-tight">Simulation de rôle</span>
            <span className="text-xs text-slate-500">{activeLabel}</span>
          </div>
          <ShieldCheck className="h-4 w-4 text-purple-500 ml-auto" />
        </button>

        {isOpen && (
          <div className="border-t border-slate-100 bg-white">
            {OPTIONS.map((option) => (
              <label
                key={option.label}
                className={`flex items-start gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 transition ${
                  viewRole === option.value ? 'bg-purple-50 text-purple-700' : 'text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="admin-view-role"
                  value={option.label}
                  checked={viewRole === option.value}
                  onChange={() => setViewRole(option.value as OptionValue)}
                  className="mt-0.5 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex flex-col">
                  <span className="font-semibold">{option.label}</span>
                  <span className="text-xs text-slate-500">{option.description}</span>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
