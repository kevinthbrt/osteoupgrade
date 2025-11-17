'use client'

import AnatomyViewer3DRealistic from '@/components/AnatomyViewer3D' // Ajuste le chemin

export default function TestingPage() {
  return (
    <div>
      <h1>Mode Création Anatomique</h1>
      <AnatomyViewer3DRealistic isAdmin={true} />
    </div>
  )
}