'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ViewRole = 'free' | 'premium_silver' | 'premium_gold' | null

type AdminViewContextValue = {
  viewRole: ViewRole
  setViewRole: (role: ViewRole) => void
  clearViewRole: () => void
}

const AdminViewContext = createContext<AdminViewContextValue | undefined>(undefined)

const STORAGE_KEY = 'admin-view-role'

export function AdminViewProvider({ children }: { children: React.ReactNode }) {
  const [viewRole, setViewRoleState] = useState<ViewRole>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (stored === 'free' || stored === 'premium_silver' || stored === 'premium_gold') {
      setViewRoleState(stored)
    }
  }, [])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const value = event.newValue
        if (value === 'free' || value === 'premium_silver' || value === 'premium_gold') {
          setViewRoleState(value)
        } else {
          setViewRoleState(null)
        }
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setViewRole = (role: ViewRole) => {
    setViewRoleState(role)
    if (role) {
      localStorage.setItem(STORAGE_KEY, role)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const value = useMemo(
    () => ({
      viewRole,
      setViewRole,
      clearViewRole: () => setViewRole(null)
    }),
    [viewRole]
  )

  return <AdminViewContext.Provider value={value}>{children}</AdminViewContext.Provider>
}

export function useAdminView() {
  const context = useContext(AdminViewContext)
  if (!context) {
    throw new Error('useAdminView must be used within an AdminViewProvider')
  }
  return context
}

export function getEffectiveRole(profileRole?: string | null, viewRole?: ViewRole) {
  if (profileRole === 'admin' && viewRole) return viewRole
  return profileRole ?? undefined
}
