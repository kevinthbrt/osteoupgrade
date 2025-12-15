'use client'

import Navigation from '@/components/Navigation'
import { AdminViewProvider } from '@/components/AdminViewContext'
import { AdminViewSwitcher } from '@/components/AdminViewSwitcher'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminViewProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <Navigation />
        <main className="lg:ml-64 transition-all duration-300">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
        <AdminViewSwitcher />
      </div>
    </AdminViewProvider>
  )
}
