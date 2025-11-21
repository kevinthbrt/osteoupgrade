'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { Suspense } from 'react'

interface Pathology {
  id: string
  name: string
  description?: string | null
  severity?: 'low' | 'medium' | 'high' | null
  position_x: number
  position_y: number
  position_z: number
  size?: number
  is_active?: boolean
  color?: string
}

interface Zone {
  id: string
  name: string
  display_name: string
  color: string
  position_x: number
  position_y: number
  position_z: number
  size_x: number
  size_y: number
  size_z: number
}

interface PathologyPlacerProps {
  zone: Zone
  pathologies: Pathology[]
  selectedPathology?: Pathology | null
  onPositionChange?: (x: number, y: number, z: number) => void
  editMode?: boolean
  modelPath?: string
}

// Zone de référence (wireframe)
function ZoneBox({ zone }: { zone: Zone }) {
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

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={zone.color}
          transparent
          opacity={0.2}
          wireframe={true}
        />
      </mesh>
      
      {/* Label de la zone - SUR LE CÔTÉ */}
      <Html 
        position={[size[0] * 0.7, 0, 0] as [number, number, number]}
        distanceFactor={8}
      >
        <div 
          className="px-3 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none bg-white border-2"
          style={{ borderColor: zone.color }}
        >
          <p className="text-sm font-semibold" style={{ color: zone.color }}>
            {zone.display_name}
          </p>
        </div>
      </Html>
    </group>
  )
}

// Pathologie visualisée avec couleur personnalisée
function PathologyMarker({ 
  pathology, 
  isSelected,
  zoneColor
}: { 
  pathology: Pathology
  isSelected: boolean
  zoneColor: string
}) {
  const position: [number, number, number] = [
    pathology.position_x,
    pathology.position_y,
    pathology.position_z
  ]
  
  const size = pathology.size || 0.08

  // Utiliser la couleur custom si définie, sinon la couleur de sévérité, sinon la couleur de la zone
  const pathologyColor = pathology.color || (
    pathology.severity === 'high' ? '#ef4444' :
    pathology.severity === 'medium' ? '#f59e0b' :
    pathology.severity === 'low' ? '#10b981' :
    zoneColor
  )

  // Label décalé sur le côté
  const labelOffset: [number, number, number] = [
    position[0] + size * 2.5,
    position[1],
    position[2]
  ]

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#8b5cf6' : pathologyColor}
          transparent
          opacity={isSelected ? 0.8 : 0.6}
          emissive={isSelected ? '#8b5cf6' : pathologyColor}
          emissiveIntensity={isSelected ? 0.6 : 0.3}
        />
      </mesh>
      
      {/* Label sur le côté */}
      <Html 
        position={labelOffset}
        distanceFactor={6}
      >
        <div 
          className={`px-3 py-1 rounded-lg shadow-lg whitespace-nowrap pointer-events-none ${
            isSelected ? 'bg-purple-600 text-white border-2 border-white' : 'bg-white border border-gray-200'
          }`}
          style={!isSelected ? { borderColor: pathologyColor } : {}}
        >
          <p className={`text-xs font-semibold ${isSelected ? 'text-white' : ''}`} 
             style={!isSelected ? { color: pathologyColor } : {}}>
            {pathology.name}
          </p>
        </div>
      </Html>
    </group>
  )
}

// Modèle 3D
function BodyModel({ modelPath }: { modelPath: string }) {
  try {
    const { scene } = useGLTF(modelPath) as any
    
    return (
      <primitive 
        object={scene} 
        scale={1.3}
        position={[0, -0.6, 0]}
        rotation={[0, Math.PI, 0]}
      />
    )
  } catch (error) {
    console.error('Error loading model:', error)
    return <SimpleFallbackBody />
  }
}

// Corps de fallback
function SimpleFallbackBody() {
  return (
    <group>
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        <meshStandardMaterial color="#fed7aa" />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.2]} />
        <meshStandardMaterial color="#bfdbfe" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.44, 0.3, 0.24]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[0.1, -0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 1.2, 16]} />
        <meshStandardMaterial color="#93c5fd" />
      </mesh>
      <mesh position={[-0.1, -0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.05, 1.2, 16]} />
        <meshStandardMaterial color="#93c5fd" />
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
        <p className="text-white text-lg font-semibold">Chargement du modèle...</p>
      </div>
    </Html>
  )
}

export default function PathologyPlacer({
  zone,
  pathologies,
  selectedPathology,
  onPositionChange,
  editMode = false,
  modelPath = '/models/human-skeleton.gltf'
}: PathologyPlacerProps) {
  // Calculer la cible de la caméra (centre de la zone)
  const cameraTarget: [number, number, number] = [
    zone.position_x,
    zone.position_y,
    zone.position_z
  ]

  // Position de la caméra (plus proche pour zoomer)
  const cameraPosition: [number, number, number] = [
    zone.position_x,
    zone.position_y,
    zone.position_z + 1.5
  ]

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={cameraPosition}
          fov={25}
        />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.5}
          maxDistance={4}
          target={cameraTarget}
        />
        
        {/* Éclairage */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <pointLight position={[0, 3, 0]} intensity={0.4} />
        <Environment preset="studio" />

        {/* Sol */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
        </mesh>

        <Suspense fallback={<LoadingScreen />}>
          {/* Modèle du corps */}
          <BodyModel modelPath={modelPath} />

          {/* Zone de référence */}
          <ZoneBox zone={zone} />

          {/* Pathologies existantes */}
          {pathologies.map((pathology) => (
            <PathologyMarker
              key={pathology.id}
              pathology={pathology}
              isSelected={selectedPathology?.id === pathology.id}
              zoneColor={zone.color}
            />
          ))}

          {/* Pathologie en cours d'édition (nouvelle) */}
          {editMode && selectedPathology && !selectedPathology.id && (
            <PathologyMarker
              pathology={selectedPathology}
              isSelected={true}
              zoneColor={zone.color}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg">
        <p className="text-sm font-semibold text-white">
          {editMode 
            ? '🎯 Mode édition : Ajustez les valeurs de position dans le formulaire' 
            : '👁️ Vue des pathologies configurées'}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Glissez pour pivoter • Molette pour zoomer
        </p>
      </div>

      {/* Compteur */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-900">{pathologies.length}</span> pathologie(s)
        </p>
      </div>

      {/* Info sur la pathologie sélectionnée */}
      {editMode && selectedPathology && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg max-w-xs">
          <p className="text-xs font-semibold text-gray-900 mb-2">En édition</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: selectedPathology.color || '#3b82f6' }}
              />
              <span className="text-gray-700 font-medium">
                {selectedPathology.name || 'Nouvelle pathologie'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Preload du modèle
if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.gltf')
}
