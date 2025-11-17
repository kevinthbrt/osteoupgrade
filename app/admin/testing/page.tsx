// app/admin/testing/page.tsx
'use client'

import AnatomyViewer3DRealistic from '@/components/AnatomyViewer3D'

export default function TestingPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Mode Création Anatomique (Admin)
        </h1>
        <div className="bg-white rounded-2xl shadow-2xl p-4">
          <AnatomyViewer3DRealistic isAdmin={true} />
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Déplace les zones • Ajoute des structures/pathologies • Sauvegarde les positions
          </p>
        </div>
      </div>
    </div>
  )
}