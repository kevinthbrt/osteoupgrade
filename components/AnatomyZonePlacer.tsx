'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { Suspense } from 'react'

interface Zone {
  id?: string
  name?: string
  display_name?: string
  color?: string
  position_x: number
  position_y: number
  position_z: number
  size_x: number
  size_y: number
  size_z: number
  is_active?: boolean
  is_symmetric?: boolean
}

interface AnatomyZonePlacerProps {
  zones: Zone[]
  selectedZone?: Zone | null
  onPositionChange?: (x: number, y: number, z: number) => void
  editMode?: boolean
  modelPath?: string
}

// Zone visualisée sur le modèle (SANS label 3D)
function ZoneBox({ zone, isSelected, isEditing }: { 
  zone: Zone
  isSelected: boolean
  isEditing: boolean
}) {
  const position: [number, number, number] = [
    zone.position_x,
    zone.position_y,
    zone.position_z
  ]
  
  const size: [number, number, number] = [
    zone.size_x,
    zone.size_y,
    zone.size_z
  ]

  const opacity = isEditing && isSelected ? 0.5 : isEditing ? 0.2 : zone.is_active !== false ? 0.3 : 0.1

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={zone.color || '#3b82f6'}
          transparent
          opacity={opacity}
          wireframe={isEditing}
        />
      </mesh>
    </group>
  )
}

// Modèle 3D du corps
function BodyModel({ modelPath }: { modelPath: string }) {
  try {
    const { scene } = useGLTF(modelPath) as any
    
    return (
      <primitive 
        object={scene} 
        scale={0.2}              // Même échelle que AnatomyViewer3D
        position={[0, 0.9, 0]}   // Même position que AnatomyViewer3D
        rotation={[0, Math.PI, 0]}
      />
    )
  } catch (error) {
    console.error('Error loading model:', error)
    return <SimpleFallbackBody />
  }
}

// Corps de fallback si le modèle ne charge pas
function SimpleFallbackBody() {
  return (
    <group>
      {/* Tête */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>

      {/* Cou */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>

      {/* Torse */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.2]} />
        <meshStandardMaterial color="#bfdbfe" />
      </mesh>

      {/* Bassin */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.44, 0.3, 0.24]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>

      {/* Jambes */}
      <mesh position={[0.1, -0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 1.2, 16]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[-0.1, -0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 1.2, 16]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>

      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  )
}

// Loader
function LoadingScreen() {
  return (
    <Html center>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
        <p className="text-white text-lg font-semibold">Chargement du modèle anatomique 3D...</p>
      </div>
    </Html>
  )
}

export default function AnatomyZonePlacer({
  zones,
  selectedZone,
  onPositionChange,
  editMode = false,
  modelPath = '/models/human-skeleton.gltf'
}: AnatomyZonePlacerProps) {
  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={[0, 1.6, 6]}   // Même position que AnatomyViewer3D
          fov={40}                  // Même FOV
        />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}           // Même que AnatomyViewer3D
          maxDistance={8}           // Même que AnatomyViewer3D
          target={[0, 0.9, 0]}      // Même cible que AnatomyViewer3D
        />
        
        {/* Éclairage optimisé pour modèle réaliste - IDENTIQUE à AnatomyViewer3D */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <pointLight position={[0, 3, 0]} intensity={0.3} />
        
        {/* Environnement HDRI pour reflets réalistes */}
        <Environment preset="studio" />

        {/* Sol avec reflets */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
        </mesh>

        <Suspense fallback={<LoadingScreen />}>
          {/* Modèle du corps */}
          <BodyModel modelPath={modelPath} />

          {/* Zones existantes (SANS labels) */}
          {zones.map((zone) => (
            <ZoneBox
              key={zone.id || zone.name}
              zone={zone}
              isSelected={selectedZone?.id === zone.id || selectedZone?.name === zone.name}
              isEditing={editMode}
            />
          ))}

          {/* Zone en cours d'édition (si nouvelle) (SANS label) */}
          {editMode && selectedZone && !selectedZone.id && (
            <ZoneBox
              zone={selectedZone}
              isSelected={true}
              isEditing={true}
            />
          )}
        </Suspense>
      </Canvas>

      {/* ✨ NOUVEAU : Affichage fixe de la zone en édition en haut de l'écran */}
      {editMode && selectedZone && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-lg shadow-xl border-2 max-w-md"
             style={{ borderColor: selectedZone.color || '#3b82f6' }}>
          <p className="font-bold text-lg" style={{ color: selectedZone.color || '#3b82f6' }}>
            {selectedZone.display_name || selectedZone.name || 'Nouvelle zone'}
          </p>
          {selectedZone.is_symmetric && (
            <p className="text-sm text-gray-600 mt-1">Zone symétrique (G/D)</p>
          )}
          <div className="text-xs text-gray-600 mt-2 font-mono">
            Position: [{selectedZone.position_x.toFixed(2)}, {selectedZone.position_y.toFixed(2)}, {selectedZone.position_z.toFixed(2)}]
          </div>
          <div className="text-xs text-gray-600 font-mono">
            Taille: [{selectedZone.size_x.toFixed(2)}, {selectedZone.size_y.toFixed(2)}, {selectedZone.size_z.toFixed(2)}]
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg">
        <p className="text-sm font-semibold text-white">
          {editMode 
            ? '🎯 Mode édition : Ajustez les valeurs dans le panneau' 
            : '🖱️ Visualisation des zones configurées'}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Glissez pour pivoter • Molette pour zoomer
        </p>
      </div>

      {/* Compteur */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-900">{zones.length}</span> zone(s)
        </p>
      </div>
    </div>
  )
}

// Preload du modèle pour performance
if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.gltf')
}