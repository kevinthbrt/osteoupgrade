'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { useState, Suspense } from 'react'

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

// Zone cliquable visualisée sur le modèle
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
      
      {/* Label */}
      {(isSelected || !isEditing) && zone.display_name && (
        <Html center distanceFactor={8}>
          <div 
            className={`px-3 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${
              isSelected ? 'bg-purple-600 text-white border-2 border-white' : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <p className="text-sm font-semibold">{zone.display_name}</p>
            {isEditing && (
              <p className="text-xs opacity-75">
                Pos: [{zone.position_x.toFixed(2)}, {zone.position_y.toFixed(2)}, {zone.position_z.toFixed(2)}]
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// Modèle 3D du corps
function BodyModel({ modelPath }: { modelPath: string }) {
  try {
    const { scene } = useGLTF(modelPath)
    
    return (
      <primitive 
        object={scene} 
        scale={0.01}
        position={[0, -1, 0]}
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
        <p className="text-gray-600">Chargement...</p>
      </div>
    </Html>
  )
}

export default function AnatomyZonePlacer({
  zones,
  selectedZone,
  onPositionChange,
  editMode = false,
  modelPath = '/models/human-skeleton.glb'
}: AnatomyZonePlacerProps) {
  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1, 3]} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={5}
          target={[0, 0.8, 0]}
        />
        
        {/* Éclairage */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <pointLight position={[0, 3, 0]} intensity={0.3} />
        
        {/* Environnement HDRI */}
        <Environment preset="studio" />

        <Suspense fallback={<LoadingScreen />}>
          {/* Modèle du corps */}
          <BodyModel modelPath={modelPath} />

          {/* Zones existantes */}
          {zones.map((zone) => (
            <ZoneBox
              key={zone.id || zone.name}
              zone={zone}
              isSelected={selectedZone?.id === zone.id || selectedZone?.name === zone.name}
              isEditing={editMode}
            />
          ))}

          {/* Zone en cours d'édition (si nouvelle) */}
          {editMode && selectedZone && !selectedZone.id && (
            <ZoneBox
              zone={selectedZone}
              isSelected={true}
              isEditing={true}
            />
          )}
        </Suspense>
      </Canvas>

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

      {/* Légende des couleurs */}
      {editMode && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-900 mb-2">Légende</p>
          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-purple-600"></div>
              <span>Zone sélectionnée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-gray-400 opacity-30"></div>
              <span>Autres zones</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Preload
if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.glb')
}
