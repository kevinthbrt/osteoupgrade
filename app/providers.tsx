'use client'

import { AdminViewProvider } from '@/components/AdminViewContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return <AdminViewProvider>{children}</AdminViewProvider>
}
