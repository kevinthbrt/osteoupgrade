'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment, TransformControls } from '@react-three/drei'
import { Suspense, useState, useRef } from 'react'
import * as THREE from 'three'

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
function ZoneBox({ zone, onHover }: { zone: Zone, onHover: (zone: Zone | null) => void }) {
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
      <mesh
        onPointerOver={() => onHover(zone)}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={zone.color}
          transparent
          opacity={0.2}
          wireframe={true}
        />
      </mesh>
    </group>
  )
}

// Pathologie visualisée avec couleur personnalisée
function PathologyMarker({ 
  pathology, 
  isSelected,
  zoneColor,
  onHover
}: { 
  pathology: Pathology
  isSelected: boolean
  zoneColor: string
  onHover: (pathology: Pathology | null) => void
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

  return (
    <group position={position}>
      <mesh
        onPointerOver={() => onHover(pathology)}
        onPointerOut={() => onHover(null)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#8b5cf6' : pathologyColor}
          transparent
          opacity={isSelected ? 0.8 : 0.6}
          emissive={isSelected ? '#8b5cf6' : pathologyColor}
          emissiveIntensity={isSelected ? 0.6 : 0.3}
        />
      </mesh>
    </group>
  )
}

// Pathologie éditable avec TransformControls
function EditablePathology({ 
  pathology, 
  zoneColor,
  onPositionChange, 
  onSizeChange,
  orbitControlsRef 
}: { 
  pathology: Pathology
  zoneColor: string
  onPositionChange: (x: number, y: number, z: number) => void
  onSizeChange?: (size: number) => void
  orbitControlsRef: any
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [mode, setMode] = useState<'translate' | 'scale'>('translate')

  const position: [number, number, number] = [
    pathology.position_x,
    pathology.position_y,
    pathology.position_z
  ]
  
  const size = pathology.size || 0.08

  const pathologyColor = pathology.color || (
    pathology.severity === 'high' ? '#ef4444' :
    pathology.severity === 'medium' ? '#f59e0b' :
    pathology.severity === 'low' ? '#10b981' :
    zoneColor
  )

  return (
    <group>
      <TransformControls
        object={meshRef}
        mode={mode}
        onMouseDown={() => {
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = false
          }
        }}
        onMouseUp={() => {
          if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = true
          }
        }}
        onChange={(e) => {
          if (meshRef.current) {
            const pos = meshRef.current.position
            onPositionChange(pos.x, pos.y, pos.z)
            
            if (mode === 'scale' && onSizeChange) {
              const scale = meshRef.current.scale
              onSizeChange(size * scale.x)
            }
          }
        }}
      >
        <mesh ref={meshRef} position={position}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshStandardMaterial
            color={pathologyColor}
            transparent
            opacity={0.8}
            emissive={pathologyColor}
            emissiveIntensity={0.5}
          />
        </mesh>
      </TransformControls>

      {/* Boutons de contrôle */}
      <Html position={[position[0], position[1] + size * 2, position[2]]} center>
        <div className="flex gap-2 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg">
          <button
            onClick={() => setMode('translate')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'translate' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📍 Déplacer
          </button>
          <button
            onClick={() => setMode('scale')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === 'scale' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📏 Taille
          </button>
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
  const [hoveredItem, setHoveredItem] = useState<{ type: 'zone' | 'pathology', data: Zone | Pathology } | null>(null)
  const orbitControlsRef = useRef<any>(null)

  const handleZoneHover = (zone: Zone | null) => {
    if (zone) {
      setHoveredItem({ type: 'zone', data: zone })
    } else if (hoveredItem?.type === 'zone') {
      setHoveredItem(null)
    }
  }

  const handlePathologyHover = (pathology: Pathology | null) => {
    if (pathology) {
      setHoveredItem({ type: 'pathology', data: pathology })
    } else if (hoveredItem?.type === 'pathology') {
      setHoveredItem(null)
    }
  }

  const handleSizeChange = (size: number) => {
    console.log('New size:', size)
  }

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
          ref={orbitControlsRef}
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
          <ZoneBox zone={zone} onHover={handleZoneHover} />

          {/* Pathologies existantes (non sélectionnées) */}
          {pathologies.map((pathology) => {
            const isSelected = selectedPathology?.id === pathology.id
            if (editMode && isSelected && selectedPathology) return null
            
            return (
              <PathologyMarker
                key={pathology.id}
                pathology={pathology}
                isSelected={false}
                zoneColor={zone.color}
                onHover={handlePathologyHover}
              />
            )
          })}

          {/* Pathologie en cours d'édition (avec TransformControls) */}
          {editMode && selectedPathology && onPositionChange && (
            <EditablePathology
              pathology={selectedPathology}
              zoneColor={zone.color}
              onPositionChange={onPositionChange}
              onSizeChange={handleSizeChange}
              orbitControlsRef={orbitControlsRef}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg">
        <p className="text-sm font-semibold text-white">
          {editMode 
            ? '🎯 Mode édition : Cliquez et déplacez la pathologie directement sur le modèle' 
            : '👁️ Vue des pathologies configurées'}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          {editMode 
            ? '📍 Déplacer • 📏 Ajuster la taille • Molette pour zoomer'
            : 'Glissez pour pivoter • Molette pour zoomer • Survolez pour voir les détails'
          }
        </p>
      </div>

      {/* Compteur */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-900">{pathologies.length}</span> pathologie(s)
        </p>
      </div>

      {/* Encadré d'info au survol - position fixe en haut à droite */}
      {hoveredItem && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-xl border-2 transition-all max-w-xs"
             style={{ 
               borderColor: hoveredItem.type === 'zone' 
                 ? (hoveredItem.data as Zone).color 
                 : (hoveredItem.data as Pathology).color || zone.color 
             }}>
          {hoveredItem.type === 'zone' ? (
            // Info de la zone
            <>
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: (hoveredItem.data as Zone).color }}
                />
                <p className="text-sm font-bold text-gray-900">
                  {(hoveredItem.data as Zone).display_name}
                </p>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Zone anatomique</span></p>
                <p className="text-gray-500">Cadre de référence</p>
              </div>
            </>
          ) : (
            // Info de la pathologie
            <>
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ 
                    backgroundColor: (hoveredItem.data as Pathology).color || (
                      (hoveredItem.data as Pathology).severity === 'high' ? '#ef4444' :
                      (hoveredItem.data as Pathology).severity === 'medium' ? '#f59e0b' :
                      (hoveredItem.data as Pathology).severity === 'low' ? '#10b981' :
                      zone.color
                    )
                  }}
                />
                <p className="text-sm font-bold text-gray-900">
                  {(hoveredItem.data as Pathology).name}
                </p>
              </div>
              <div className="space-y-1 text-xs">
                {(hoveredItem.data as Pathology).description && (
                  <p className="text-gray-600 mb-2">{(hoveredItem.data as Pathology).description}</p>
                )}
                {(hoveredItem.data as Pathology).severity && (
                  <span className={`inline-block px-2 py-0.5 rounded ${
                    (hoveredItem.data as Pathology).severity === 'high' ? 'bg-red-100 text-red-700' :
                    (hoveredItem.data as Pathology).severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {(hoveredItem.data as Pathology).severity === 'high' ? 'Grave' :
                     (hoveredItem.data as Pathology).severity === 'medium' ? 'Modéré' : 'Léger'}
                  </span>
                )}
                {editMode && (
                  <p className="text-gray-500 mt-2">
                    <span className="font-medium">Position:</span> [
                    {(hoveredItem.data as Pathology).position_x.toFixed(2)}, 
                    {(hoveredItem.data as Pathology).position_y.toFixed(2)}, 
                    {(hoveredItem.data as Pathology).position_z.toFixed(2)}]
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Info sur la pathologie sélectionnée (seulement si pas de survol et en mode édition) */}
      {editMode && selectedPathology && !hoveredItem && (
        <div className="absolute top-4 right-4 bg-purple-50/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg max-w-xs border-2 border-purple-300">
          <p className="text-xs font-semibold text-purple-900 mb-2">✏️ Mode édition 3D</p>
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
            <p className="text-gray-500 mt-2 italic">
              Les valeurs se mettent à jour en temps réel
            </p>
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
