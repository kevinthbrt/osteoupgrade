'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment, TransformControls } from '@react-three/drei'
import { Suspense, useState, useRef } from 'react'
import * as THREE from 'three'

interface Structure {
  id: string
  name: string
  type: 'musculaire' | 'osseuse' | 'articulaire' | 'neuro' | 'vasculaire' | 'ligamentaire' | 'cutanée'
  description?: string | null
  position_x: number
  position_y: number
  position_z: number
  size?: number
  is_active?: boolean
  color?: string
  pathology_count?: number // Nombre de pathologies associées
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

interface StructurePlacerProps {
  zone: Zone
  structures: Structure[]
  selectedStructure?: Structure | null
  onPositionChange?: (x: number, y: number, z: number) => void
  onStructureSelect?: (structure: Structure) => void
  editMode?: boolean
  modelPath?: string
}

// Couleurs par type de structure
const structureTypeColors: Record<string, string> = {
  musculaire: '#ef4444',    // Rouge
  osseuse: '#f59e0b',       // Orange
  articulaire: '#3b82f6',   // Bleu
  neuro: '#8b5cf6',         // Violet
  vasculaire: '#ec4899',    // Rose
  ligamentaire: '#10b981',  // Vert
  cutanée: '#6366f1'        // Indigo
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

// Structure visualisée (sphère cliquable)
function StructureMarker({ 
  structure, 
  isSelected,
  onHover,
  onClick
}: { 
  structure: Structure
  isSelected: boolean
  onHover: (structure: Structure | null) => void
  onClick: (structure: Structure) => void
}) {
  const position: [number, number, number] = [
    structure.position_x,
    structure.position_y,
    structure.position_z
  ]
  
  const size = structure.size || 0.08

  // Utiliser la couleur custom si définie, sinon la couleur du type
  const structureColor = structure.color || structureTypeColors[structure.type] || '#3b82f6'

  return (
    <group position={position}>
      <mesh
        onPointerOver={() => onHover(structure)}
        onPointerOut={() => onHover(null)}
        onClick={() => onClick(structure)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#8b5cf6' : structureColor}
          transparent
          opacity={isSelected ? 0.9 : 0.7}
          emissive={isSelected ? '#8b5cf6' : structureColor}
          emissiveIntensity={isSelected ? 0.7 : 0.4}
        />
      </mesh>
      
      {/* Badge avec nombre de pathologies */}
      {structure.pathology_count && structure.pathology_count > 0 && (
        <Html position={[0, size * 1.5, 0]} center>
          <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold shadow-lg border-2" 
               style={{ borderColor: structureColor }}>
            {structure.pathology_count}
          </div>
        </Html>
      )}
    </group>
  )
}

// Structure éditable avec TransformControls
function EditableStructure({ 
  structure, 
  onPositionChange, 
  onSizeChange,
  orbitControlsRef,
  mode
}: { 
  structure: Structure
  onPositionChange: (x: number, y: number, z: number) => void
  onSizeChange?: (size: number) => void
  orbitControlsRef: any
  mode: 'translate' | 'scale'
}) {
  const meshRef = useRef<THREE.Mesh>(null!)

  const position: [number, number, number] = [
    structure.position_x,
    structure.position_y,
    structure.position_z
  ]
  
  const size = structure.size || 0.08
  const structureColor = structure.color || structureTypeColors[structure.type] || '#3b82f6'

  return (
    <group>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={structureColor}
          transparent
          opacity={0.9}
          emissive={structureColor}
          emissiveIntensity={0.6}
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
              onSizeChange(size * scale.x)
            }
          }
        }}
      />
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

export default function StructurePlacer({
  zone,
  structures,
  selectedStructure,
  onPositionChange,
  onStructureSelect,
  editMode = false,
  modelPath = '/models/human-skeleton.gltf'
}: StructurePlacerProps) {
  const [hoveredItem, setHoveredItem] = useState<{ type: 'zone' | 'structure', data: Zone | Structure } | null>(null)
  const [mode, setMode] = useState<'translate' | 'scale'>('translate')
  const orbitControlsRef = useRef<any>(null)

  const handleZoneHover = (zone: Zone | null) => {
    if (zone) {
      setHoveredItem({ type: 'zone', data: zone })
    } else if (hoveredItem?.type === 'zone') {
      setHoveredItem(null)
    }
  }

  const handleStructureHover = (structure: Structure | null) => {
    if (structure) {
      setHoveredItem({ type: 'structure', data: structure })
    } else if (hoveredItem?.type === 'structure') {
      setHoveredItem(null)
    }
  }

  const handleStructureClick = (structure: Structure) => {
    if (onStructureSelect) {
      onStructureSelect(structure)
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

  // Position de la caméra
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

          {/* Structures existantes (non sélectionnées) */}
          {structures.map((structure) => {
            const isSelected = selectedStructure?.id === structure.id
            if (editMode && isSelected && selectedStructure) return null
            
            return (
              <StructureMarker
                key={structure.id}
                structure={structure}
                isSelected={false}
                onHover={handleStructureHover}
                onClick={handleStructureClick}
              />
            )
          })}

          {/* Structure en cours d'édition (avec TransformControls) */}
          {editMode && selectedStructure && onPositionChange && (
            <EditableStructure
              structure={selectedStructure}
              onPositionChange={onPositionChange}
              onSizeChange={handleSizeChange}
              orbitControlsRef={orbitControlsRef}
              mode={mode}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg">
        <p className="text-sm font-semibold text-white">
          {editMode 
            ? '🎯 Mode édition : Utilisez les contrôles en haut à droite pour positionner' 
            : '👁️ Cliquez sur une structure (sphère) pour voir ses pathologies'}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          {editMode 
            ? 'Les flèches 3D apparaissent sur la structure • Contrôles dans l\'encart violet'
            : 'Glissez pour pivoter • Molette pour zoomer • Le badge indique le nombre de pathologies'
          }
        </p>
      </div>

      {/* Compteur */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-900">{structures.length}</span> structure(s)
        </p>
      </div>

      {/* Encadré d'info au survol - en mode visualisation seulement */}
      {hoveredItem && !editMode && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-xl border-2 transition-all max-w-xs"
             style={{ 
               borderColor: hoveredItem.type === 'zone' 
                 ? (hoveredItem.data as Zone).color 
                 : (hoveredItem.data as Structure).color || structureTypeColors[(hoveredItem.data as Structure).type] || '#3b82f6'
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
            // Info de la structure
            <>
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ 
                    backgroundColor: (hoveredItem.data as Structure).color || structureTypeColors[(hoveredItem.data as Structure).type] || '#3b82f6'
                  }}
                />
                <p className="text-sm font-bold text-gray-900">
                  {(hoveredItem.data as Structure).name}
                </p>
              </div>
              <div className="space-y-1 text-xs">
                <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                  {(hoveredItem.data as Structure).type}
                </span>
                {(hoveredItem.data as Structure).description && (
                  <p className="text-gray-600 mt-2">{(hoveredItem.data as Structure).description}</p>
                )}
                {(hoveredItem.data as Structure).pathology_count !== undefined && (
                  <p className="text-primary-600 font-semibold mt-2">
                    {(hoveredItem.data as Structure).pathology_count} pathologie(s)
                  </p>
                )}
                <p className="text-gray-500 italic mt-2">
                  Cliquez pour gérer les pathologies
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Encart avec contrôles 3D en mode édition */}
      {editMode && selectedStructure && (
        <div className="absolute top-4 right-4 bg-purple-50/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg max-w-xs border-2 border-purple-300">
          <p className="text-xs font-semibold text-purple-900 mb-3">✏️ Mode édition 3D</p>
          
          {/* Contrôles de mode */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setMode('translate')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === 'translate' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              📍 Déplacer
            </button>
            <button
              onClick={() => setMode('scale')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                mode === 'scale' 
                  ? 'bg-purple-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              📏 Taille
            </button>
          </div>

          {/* Info structure */}
          <div className="space-y-2 text-xs border-t border-purple-200 pt-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: selectedStructure.color || structureTypeColors[selectedStructure.type] || '#3b82f6' }}
              />
              <span className="text-gray-700 font-medium truncate">
                {selectedStructure.name || 'Nouvelle structure'}
              </span>
            </div>
            <span className="inline-block px-2 py-0.5 rounded bg-white text-gray-700 text-xs border border-gray-200">
              {selectedStructure.type}
            </span>
            <p className="text-gray-500 italic">
              {mode === 'translate' 
                ? 'Utilisez les flèches pour déplacer' 
                : 'Utilisez les cubes pour redimensionner'}
            </p>
            <p className="text-purple-700 font-medium">
              Les valeurs se mettent à jour en temps réel
            </p>
          </div>
        </div>
      )}

      {/* Légende des types de structures */}
      {!editMode && !hoveredItem && structures.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg max-w-xs">
          <p className="text-xs font-semibold text-gray-900 mb-2">🏥 Types de structures</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(structureTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-gray-700 capitalize">{type}</span>
              </div>
            ))}
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
