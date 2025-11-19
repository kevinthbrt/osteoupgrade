'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { useState, Suspense } from 'react'

// Interface pour les zones chargées depuis la DB
interface AnatomyZone {
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
  is_symmetric: boolean
}

interface AnatomyStructure {
  id: string
  zone_id: string
  name: string
  description: string | null
  position_x: number
  position_y: number
  position_z: number
}

interface Pathology {
  id: string
  structure_id: string
  name: string
  description: string | null
  severity: 'low' | 'medium' | 'high' | null
}

interface AnatomyViewer3DProps {
  zones: AnatomyZone[]
  structures: Record<string, AnatomyStructure[]>
  pathologies: Record<string, Pathology[]>
  onPathologySelect: (pathologies: Pathology[], structureName: string) => void
  modelPath?: string
}

// Zone cliquable invisible superposée au modèle
function ClickableZone({ 
  zone, 
  onClick, 
  isHovered,
  onHover,
  side = 'center'
}: any) {
  let position = [zone.position_x, zone.position_y, zone.position_z]
  
  // Si la zone est symétrique et c'est le côté droit, inverser X
  if (zone.is_symmetric && side === 'right') {
    position = [-zone.position_x, zone.position_y, zone.position_z]
  }

  const size = [zone.size_x, zone.size_y, zone.size_z]

  return (
    <group position={position as [number, number, number]}>
      {/* Zone invisible mais cliquable */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick(zone.id, side)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          onHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          onHover(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={size as [number, number, number]} />
        <meshBasicMaterial 
          color={zone.color}
          transparent
          opacity={isHovered ? 0.3 : 0}
          wireframe={isHovered}
        />
      </mesh>
      
      {/* Label qui apparaît au survol */}
      {isHovered && (
        <Html center distanceFactor={8}>
          <div className="bg-white px-4 py-2 rounded-lg shadow-xl border-2 whitespace-nowrap pointer-events-none"
            style={{ borderColor: zone.color }}>
            <p className="font-bold text-gray-900" style={{ color: zone.color }}>
              {zone.display_name}
            </p>
            {zone.is_symmetric && (
              <p className="text-xs text-gray-600">
                {side === 'left' ? 'Gauche' : 'Droite'}
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// Modèle 3D réaliste chargé depuis un fichier GLTF
function RealisticBodyModel({ 
  zones,
  onRegionClick, 
  hoveredRegion, 
  setHoveredRegion,
  modelPath 
}: any) {
  // ✅ Cast pour éviter l'erreur de type
  const { scene } = useGLTF(modelPath) as any
  
  return (
    <group>
      {/* Le modèle 3D réaliste - MÊMES paramètres que AnatomyZonePlacer */}
      <primitive 
        object={scene} 
        scale={0.2}
        position={[0, 0.9, 0]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Zones cliquables invisibles superposées - CHARGÉES DEPUIS LA DB */}
      {zones.map((zone: AnatomyZone) => {
        if (zone.is_symmetric) {
          return (
            <group key={zone.id}>
              <ClickableZone
                zone={zone}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${zone.id}-left`}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? `${zone.id}-left` : null)}
                side="left"
              />
              <ClickableZone
                zone={zone}
                onClick={onRegionClick}
                isHovered={hoveredRegion === `${zone.id}-right`}
                onHover={(hovered: boolean) => setHoveredRegion(hovered ? `${zone.id}-right` : null)}
                side="right"
              />
            </group>
          )
        }
        
        return (
          <ClickableZone
            key={zone.id}
            zone={zone}
            onClick={onRegionClick}
            isHovered={hoveredRegion === zone.id}
            onHover={(hovered: boolean) => setHoveredRegion(hovered ? zone.id : null)}
          />
        )
      })}
    </group>
  )
}

// Vue détaillée d'une zone avec ses structures
function RegionDetailView({ 
  zone,
  structures,
  pathologies,
  onStructureClick,
  onBack,
  side 
}: any) {
  const [hoveredStructure, setHoveredStructure] = useState<string | null>(null)

  // Structures de cette zone
  const zoneStructures = structures[zone.id] || []

  if (zoneStructures.length === 0) {
    return (
      <group>
        <Html position={[0, 2, 0]} center>
          <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2">
            <h2 className="text-xl font-bold" style={{ color: zone.color }}>
              {zone.display_name} {side && `(${side === 'left' ? 'Gauche' : 'Droite'})`}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Aucune structure définie pour cette zone
            </p>
            <button 
              onClick={onBack}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              ← Retour à la vue globale
            </button>
          </div>
        </Html>
      </group>
    )
  }

  return (
    <group>
      <Html position={[0, 2, 0]} center>
        <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2">
          <h2 className="text-xl font-bold" style={{ color: zone.color }}>
            {zone.display_name} {side && `(${side === 'left' ? 'Gauche' : 'Droite'})`}
          </h2>
          <button 
            onClick={onBack}
            className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            ← Retour à la vue globale
          </button>
        </div>
      </Html>

      {zoneStructures.map((structure: AnatomyStructure, index: number) => {
        const angle = (index / zoneStructures.length) * Math.PI * 2
        const radius = 1.5
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const isHovered = hoveredStructure === structure.id

        return (
          <group key={structure.id} position={[x, 0, z]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation()
                onStructureClick(structure)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHoveredStructure(structure.id)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHoveredStructure(null)
                document.body.style.cursor = 'auto'
              }}
            >
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial 
                color={zone.color}
                opacity={isHovered ? 1 : 0.7}
                transparent
                emissive={zone.color}
                emissiveIntensity={isHovered ? 0.5 : 0.2}
              />
            </mesh>

            <Html center distanceFactor={6}>
              <div 
                className={`px-3 py-2 rounded-lg shadow-md transition-all ${
                  isHovered 
                    ? 'bg-white border-2 scale-110' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
                style={{ 
                  borderColor: isHovered ? zone.color : undefined,
                  minWidth: '150px'
                }}
              >
                <p className={`text-sm font-semibold text-center ${
                  isHovered ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {structure.name}
                </p>
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// Loader pendant le chargement du modèle 3D
function LoadingScreen() {
  return (
    <Html center>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">
          Chargement du modèle anatomique 3D...
        </p>
      </div>
    </Html>
  )
}

// Composant principal
export default function AnatomyViewer3D({ 
  zones,
  structures,
  pathologies,
  onPathologySelect,
  modelPath = '/models/human-skeleton.gltf'
}: AnatomyViewer3DProps) {
  const [viewMode, setViewMode] = useState<'global' | 'region'>('global')
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)
  const [selectedSide, setSelectedSide] = useState<string>('center')
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const handleRegionClick = (zoneId: string, side: string = 'center') => {
    setSelectedZoneId(zoneId)
    setSelectedSide(side)
    setViewMode('region')
  }

  const handleStructureClick = (structure: AnatomyStructure) => {
    // Récupérer les pathologies de cette structure
    const structurePathologies = pathologies[structure.id] || []
    onPathologySelect(structurePathologies, structure.name)
  }

  const handleBack = () => {
    setViewMode('global')
    setSelectedZoneId(null)
    setSelectedSide('center')
  }

  const selectedZone = zones.find(z => z.id === selectedZoneId)

  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={[0, 1.6, 6]}
          fov={40}
        />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={8}
          target={[0, 0.9, 0]}
        />

        {/* Éclairage optimisé pour modèle réaliste */}
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
          {viewMode === 'global' && (
            <RealisticBodyModel 
              zones={zones}
              onRegionClick={handleRegionClick}
              hoveredRegion={hoveredRegion}
              setHoveredRegion={setHoveredRegion}
              modelPath={modelPath}
            />
          )}

          {viewMode === 'region' && selectedZone && (
            <RegionDetailView
              zone={selectedZone}
              structures={structures}
              pathologies={pathologies}
              onStructureClick={handleStructureClick}
              onBack={handleBack}
              side={selectedSide}
            />
          )}
        </Suspense>
      </Canvas>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-white">
          {viewMode === 'global' 
            ? '🖱️ Survolez et cliquez sur une région anatomique' 
            : '🎯 Cliquez sur une structure pour voir les pathologies'}
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Glissez pour pivoter • Molette pour zoomer
        </p>
      </div>

      {/* Message si aucune zone */}
      {viewMode === 'global' && zones.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg text-center">
          <p className="text-gray-900 font-semibold mb-2">Aucune zone anatomique configurée</p>
          <p className="text-sm text-gray-600">
            Les zones doivent être créées via l'interface admin
          </p>
        </div>
      )}
    </div>
  )
}

// Preload du modèle pour performance
if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.gltf')
}
