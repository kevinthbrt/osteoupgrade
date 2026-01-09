'use client'

import { useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import { ArrowLeft, Construction } from 'lucide-react'

export default function EditCasePage() {
  const router = useRouter()

  return (
    <AuthLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <Construction className="h-24 w-24 text-amber-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Éditeur de cas cliniques
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            L'éditeur complet pour gérer les chapitres, modules et quiz sera disponible prochainement.
            <br />
            Pour l'instant, utilisez l'interface de visualisation pour tester le nouveau système.
          </p>
          <button
            onClick={() => router.push('/encyclopedia/learning/cases')}
            className="px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour aux cas cliniques
          </button>
        </div>
      </div>
    </AuthLayout>
  )
}
