'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment, TransformControls } from '@react-three/drei'
import { useState, Suspense, useRef, useEffect } from 'react'
import * as THREE from 'three'

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
function ZoneBox({ zone, isSelected, isEditing, onHover }: { 
  zone: Zone
  isSelected: boolean
  isEditing: boolean
  onHover: (zone: Zone | null) => void
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
      <mesh
        onPointerOver={() => onHover(zone)}
        onPointerOut={() => onHover(null)}
      >
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

// Zone éditable avec TransformControls
function EditableZone({ 
  zone, 
  onPositionChange, 
  onSizeChange,
  orbitControlsRef 
}: { 
  zone: Zone
  onPositionChange: (x: number, y: number, z: number) => void
  onSizeChange?: (x: number, y: number, z: number) => void
  orbitControlsRef: any
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [mode, setMode] = useState<'translate' | 'scale'>('translate')

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
    <group>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={zone.color || '#3b82f6'}
          transparent
          opacity={0.6}
          wireframe={true}
        />
      </mesh>
      
      <TransformControls
        object={meshRef.current}
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
              onSizeChange(
                zone.size_x * scale.x,
                zone.size_y * scale.y,
                zone.size_z * scale.z
              )
            }
          }
        }}
      />

      {/* Boutons de contrôle */}
      <Html position={[position[0], position[1] + size[1] * 0.7, position[2]]} center>
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
            📏 Redimensionner
          </button>
        </div>
      </Html>
    </group>
  )
}

// Modèle 3D du corps - IDENTIQUE à AnatomyViewer3D.tsx
function BodyModel({ modelPath }: { modelPath: string }) {
  try {
    // ✅ Cast pour éviter l'erreur de type
    const { scene } = useGLTF(modelPath) as any
    
    return (
      <primitive 
        object={scene} 
        scale={1.3}              // Même échelle que AnatomyViewer3D
        position={[0, -0.6, 0]}   // Même position que AnatomyViewer3D
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
  modelPath = '/models/human-skeleton.gltf' // Même chemin que AnatomyViewer3D
}: AnatomyZonePlacerProps) {
  const [hoveredZone, setHoveredZone] = useState<Zone | null>(null)
  const orbitControlsRef = useRef<any>(null)

  const handleSizeChange = (x: number, y: number, z: number) => {
    // Optionnel : ajouter un callback pour la taille si nécessaire
    console.log('New size:', x, y, z)
  }

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={[0, 1.6, 6]}   // Même position que AnatomyViewer3D
          fov={25}                  // Même FOV
        />
        <OrbitControls 
          ref={orbitControlsRef}
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

          {/* Zones existantes (non sélectionnées) */}
          {zones.map((zone) => {
            const isSelected = selectedZone?.id === zone.id || selectedZone?.name === zone.name
            if (editMode && isSelected && selectedZone) return null
            
            return (
              <ZoneBox
                key={zone.id || zone.name}
                zone={zone}
                isSelected={false}
                isEditing={editMode}
                onHover={setHoveredZone}
              />
            )
          })}

          {/* Zone en cours d'édition (avec TransformControls) */}
          {editMode && selectedZone && onPositionChange && (
            <EditableZone
              zone={selectedZone}
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
            ? '🎯 Mode édition : Cliquez et déplacez la zone directement sur le modèle' 
            : '🖱️ Visualisation des zones configurées'}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          {editMode 
            ? '📍 Déplacer • 📏 Redimensionner • Molette pour zoomer'
            : 'Glissez pour pivoter • Molette pour zoomer • Survolez une zone pour voir ses détails'
          }
        </p>
      </div>

      {/* Encadré d'info au survol - position fixe en haut à droite */}
      {hoveredZone && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-xl border-2 transition-all"
             style={{ borderColor: hoveredZone.color || '#3b82f6' }}>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: hoveredZone.color || '#3b82f6' }}
            />
            <p className="text-sm font-bold text-gray-900">
              {hoveredZone.display_name || hoveredZone.name}
            </p>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <p><span className="font-medium">ID:</span> {hoveredZone.name}</p>
            {editMode && (
              <>
                <p><span className="font-medium">Position:</span> [{hoveredZone.position_x.toFixed(2)}, {hoveredZone.position_y.toFixed(2)}, {hoveredZone.position_z.toFixed(2)}]</p>
                <p><span className="font-medium">Taille:</span> [{hoveredZone.size_x.toFixed(2)}, {hoveredZone.size_y.toFixed(2)}, {hoveredZone.size_z.toFixed(2)}]</p>
              </>
            )}
            {hoveredZone.is_symmetric && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                Symétrique
              </span>
            )}
            {hoveredZone.is_active === false && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                Inactive
              </span>
            )}
          </div>
        </div>
      )}

      {/* Légende des couleurs (seulement en mode édition et si pas de survol) */}
      {editMode && !hoveredZone && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
          <p className="text-xs font-semibold text-gray-900 mb-2">💡 Contrôles 3D</p>
          <div className="space-y-1 text-xs text-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Mode Déplacer</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span>Mode Redimensionner</span>
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

// Preload du modèle pour performance
if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.gltf')
}
