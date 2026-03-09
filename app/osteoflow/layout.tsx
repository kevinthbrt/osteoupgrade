import { Sidebar } from '@/components/osteoflow/layout/sidebar'
import { Header } from '@/components/osteoflow/layout/header'
import { UpdateBanner } from '@/components/osteoflow/layout/update-banner'
import { WhatsNewDialog } from '@/components/osteoflow/layout/whats-new-dialog'

export const dynamic = 'force-dynamic'

export default function OsteoflowLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <div className="lg:pl-64">
        <UpdateBanner />
        <Header user={null} practitioner={null} />
        <main className="p-4 lg:px-8 lg:py-6">
          {children}
        </main>
      </div>
      <WhatsNewDialog />
    </div>
  )
}
