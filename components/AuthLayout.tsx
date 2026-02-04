'use client'

import Navigation from '@/components/Navigation'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <Navigation />
      <main className="lg:ml-64 transition-all duration-300 overflow-x-hidden">
        <div className="p-4 lg:p-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
