// app/admin/testing/page.tsx
'use client'

import AnatomyViewer3DRealistic from '@/components/AnatomyViewer3D'

export default function TestingPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Mode Admin – Édition Anatomique
        </h1>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <AnatomyViewer3DRealistic isAdmin={true} />
        </div>
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-lg">
            Déplace les zones • Ajoute des structures • Sauvegarde les positions dans Supabase
          </p>
        </div>
      </div>
    </div>
  )
}