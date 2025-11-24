'use client'

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { useState, Suspense, useRef, useEffect } from 'react'
import * as THREE from 'three'

// Interfaces
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

interface Structure {
  id: string
  zone_id: string
  name: string
  type: 'musculaire' | 'osseuse' | 'articulaire' | 'neuro' | 'vasculaire' | 'ligamentaire' | 'cutanée'
  description: string | null
  color: string
  position_x: number
  position_y: number
  position_z: number
  size: number
  pathology_count?: number
}

interface Pathology {
  id: string
  structure_id: string
  name: string
  description: string | null
  severity: 'low' | 'medium' | 'high' | null
}

interface PathologyTest {
  id: string
  name: string
  description: string | null
  video_url?: string | null
  sensitivity?: number
  specificity?: number
}

interface AnatomyViewer3DProps {
  zones: AnatomyZone[]
  structures: Record<string, Structure[]>
  pathologies: Record<string, Pathology[]>
  pathologyTests: Record<string, PathologyTest[]>
  pathologyClusters?: Record<string, any[]>
  onTestSelect?: (tests: PathologyTest[], pathologyName: string) => void
  modelPath?: string
}

// Couleurs par type de structure
const STRUCTURE_TYPE_COLORS: Record<string, string> = {
  musculaire: '#ef4444',
  osseuse: '#f59e0b',
  articulaire: '#3b82f6',
  neuro: '#8b5cf6',
  vasculaire: '#ec4899',
  ligamentaire: '#10b981',
  cutanée: '#6366f1'
}

// Zone cliquable
function ClickableZone({ 
  zone, 
  onClick, 
  isHovered,
  onHover,
  side = 'center'
}: any) {
  let position = [zone.position_x, zone.position_y, zone.position_z]
  
  if (zone.is_symmetric && side === 'right') {
    position = [-zone.position_x, zone.position_y, zone.position_z]
  }

  const size = [zone.size_x, zone.size_y, zone.size_z]

  return (
    <group position={position as [number, number, number]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick(zone, side)
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
    </group>
  )
}

// Structure cliquable (sphère colorée) – sans badge
function StructureMarker({ 
  structure,
  onClick, 
  isHovered,
  onHover 
}: any) {
  const position: [number, number, number] = [
    structure.position_x,
    structure.position_y,
    structure.position_z
  ]

  const size = structure.size || 0.08
  const color = structure.color || STRUCTURE_TYPE_COLORS[structure.type] || '#3b82f6'

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick(structure)
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
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={isHovered ? 0.9 : 0.7}
          emissive={color}
          emissiveIntensity={isHovered ? 0.6 : 0.4}
        />
      </mesh>
    </group>
  )
}

// Contrôle de la caméra pour zoom
function CameraController({ 
  targetPosition, 
  targetZoom,
  isZooming 
}: any) {
  const { camera, controls } = useThree()
  const controlsRef = useRef<any>(controls)

  useEffect(() => {
    if (isZooming && targetPosition) {
      const startPos = camera.position.clone()
      const endPos = new THREE.Vector3(
        targetPosition[0],
        targetPosition[1],
        targetPosition[2] + targetZoom
      )

      let progress = 0
      const duration = 1000

      const animate = () => {
        progress += 16 / duration
        if (progress < 1) {
          camera.position.lerpVectors(startPos, endPos, progress)
          
          if (controlsRef.current) {
            controlsRef.current.target.set(
              targetPosition[0],
              targetPosition[1],
              targetPosition[2]
            )
            controlsRef.current.update()
          }

          requestAnimationFrame(animate)
        }
      }

      animate()
    }
  }, [targetPosition, targetZoom, isZooming, camera])

  return null
}

// Modèle 3D avec zones et structures
function RealisticBodyModel({ 
  zones,
  structures,
  onRegionClick,
  onStructureClick,
  hoveredRegion, 
  hoveredStructure,
  setHoveredRegion,
  setHoveredStructure,
  modelPath,
  viewMode,
  selectedZone
}: any) {
  const { scene } = useGLTF(modelPath) as any
  
  return (
    <group>
      <primitive 
        object={scene} 
        scale={1.3}
        position={[0, -0.6, 0]}
        rotation={[0, Math.PI, 0]}
      />

      {viewMode === 'global' && zones.map((zone: AnatomyZone) => {
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

      {viewMode === 'zoomed' && selectedZone && structures[selectedZone.id]?.map((structure: Structure) => (
        <StructureMarker
          key={structure.id}
          structure={structure}
          onClick={onStructureClick}
          isHovered={hoveredStructure === structure.id}
          onHover={(hovered: boolean) => setHoveredStructure(hovered ? structure.id : null)}
        />
      ))}
    </group>
  )
}

// Loader
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

// Composant pour description de test avec "Afficher plus"
function TestDescription({ description }: { description: string | null }) {
  const [expanded, setExpanded] = useState(false)
  
  if (!description) return null
  
  const shouldTruncate = description.length > 100
  const displayText = !shouldTruncate || expanded 
    ? description 
    : description.substring(0, 100) + '...'
  
  return (
    <div>
      <p className="text-sm text-gray-600 mt-1">{displayText}</p>
      {shouldTruncate && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
        >
          {expanded ? 'Afficher moins' : 'Afficher plus'}
        </button>
      )}
    </div>
  )
}

// Composant principal
export default function AnatomyViewer3D({ 
  zones,
  structures,
  pathologies,
  pathologyTests,
  pathologyClusters = {},
  onTestSelect,
  modelPath = '/models/human-skeleton.gltf'
}: AnatomyViewer3DProps) {
  const [viewMode, setViewMode] = useState<'global' | 'zoomed'>('global')
  const [selectedZone, setSelectedZone] = useState<AnatomyZone | null>(null)
  const [selectedSide, setSelectedSide] = useState<string>('center')
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [hoveredStructure, setHoveredStructure] = useState<string | null>(null)
  const [isZooming, setIsZooming] = useState(false)
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null)
  
  // Modals
  const [showStructureModal, setShowStructureModal] = useState(false)
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null)
  const [showPathologyModal, setShowPathologyModal] = useState(false)
  const [selectedPathology, setSelectedPathology] = useState<Pathology | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null)

  const handleRegionClick = (zone: AnatomyZone, side: string = 'center') => {
    setSelectedZone(zone)
    setSelectedSide(side)
    
    let zoomPos: [number, number, number] = [
      zone.position_x,
      zone.position_y,
      zone.position_z
    ]

    if (zone.is_symmetric && side === 'right') {
      zoomPos = [-zone.position_x, zone.position_y, zone.position_z]
    }

    setCameraTarget(zoomPos)
    setIsZooming(true)
    setViewMode('zoomed')

    setTimeout(() => setIsZooming(false), 1100)
  }

  const handleStructureClick = (structure: Structure) => {
    setSelectedStructure(structure)
    setShowStructureModal(true)
  }

  const handlePathologyClick = (pathology: Pathology) => {
    setSelectedPathology(pathology)
    setShowPathologyModal(true)
    setShowStructureModal(false)
  }

  const handleBack = () => {
    setViewMode('global')
    setSelectedZone(null)
    setSelectedSide('center')
    setCameraTarget(null)
    setIsZooming(false)
    setHoveredStructure(null)
  }

  const handleWatchVideo = (videoUrl: string) => {
    let videoId = ''
    if (videoUrl.includes('youtube.com/watch?v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0]
    } else if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]
    }
    
    if (videoId) {
      setCurrentVideoUrl(`https://www.youtube.com/embed/${videoId}`)
      setShowVideoModal(true)
    } else {
      window.open(videoUrl, '_blank')
    }
  }

  const zoneStructures = selectedZone ? structures[selectedZone.id] || [] : []
  const structurePathologies = selectedStructure ? pathologies[selectedStructure.id] || [] : []
  const pathologyClustersForSelected = selectedPathology
    ? (pathologyClusters[selectedPathology.id] || [])
    : []

  // Zone survolée
  const hoveredZoneInfo = viewMode === 'global' ? zones.find(z => 
    hoveredRegion === z.id || 
    hoveredRegion === `${z.id}-left` || 
    hoveredRegion === `${z.id}-right`
  ) : null

  // Structure survolée
  const hoveredStructureInfo = viewMode === 'zoomed' && hoveredStructure && selectedZone
    ? structures[selectedZone.id]?.find(s => s.id === hoveredStructure)
    : null

  return (
    <div className="relative">
      <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
        <Canvas shadows>
          <PerspectiveCamera 
            makeDefault 
            position={[0, 1.6, 6]}
            fov={25}
          />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={8}
            target={cameraTarget || [0, 0.9, 0]}
          />

          <CameraController
            targetPosition={cameraTarget}
            targetZoom={viewMode === 'zoomed' ? 1.5 : 4}
            isZooming={isZooming}
          />

          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-5, 3, -5]} intensity={0.4} />
          <pointLight position={[0, 3, 0]} intensity={0.3} />
          
          <Environment preset="studio" />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
          </mesh>

          <Suspense fallback={<LoadingScreen />}>
            <RealisticBodyModel 
              zones={zones}
              structures={structures}
              onRegionClick={handleRegionClick}
              onStructureClick={handleStructureClick}
              hoveredRegion={hoveredRegion}
              hoveredStructure={hoveredStructure}
              setHoveredRegion={setHoveredRegion}
              setHoveredStructure={setHoveredStructure}
              modelPath={modelPath}
              viewMode={viewMode}
              selectedZone={selectedZone}
            />
          </Suspense>
        </Canvas>

        {/* Encart zone survolée (mode global) */}
        {viewMode === 'global' && hoveredZoneInfo && (
          <div
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-lg shadow-xl border-2 max-w-md"
            style={{ borderColor: hoveredZoneInfo.color }}
          >
            <p className="font-bold text-lg" style={{ color: hoveredZoneInfo.color }}>
              {hoveredZoneInfo.display_name}
            </p>
            {hoveredRegion?.includes('-') && (
              <p className="text-sm text-gray-600 mt-1">
                {hoveredRegion.includes('left') ? 'Gauche' : 'Droite'}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-1">
              {structures[hoveredZoneInfo.id]?.length || 0} structure(s) configurée(s)
            </p>
          </div>
        )}

        {/* Encart structure survolée (mode zoomed) */}
        {viewMode === 'zoomed' && hoveredStructureInfo && (
          <div
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-6 py-3 rounded-lg shadow-xl border-2 max-w-md"
            style={{ borderColor: hoveredStructureInfo.color }}
          >
            <p className="font-bold text-lg" style={{ color: hoveredStructureInfo.color }}>
              {hoveredStructureInfo.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Type : {hoveredStructureInfo.type}
            </p>
            {hoveredStructureInfo.description && (
              <p className="text-sm text-gray-600 mt-1">
                {hoveredStructureInfo.description.substring(0, 60)}
                {hoveredStructureInfo.description.length > 60 ? '...' : ''}
              </p>
            )}
            {hoveredStructureInfo.pathology_count && (
              <p className="text-xs text-primary-600 font-semibold mt-2">
                {hoveredStructureInfo.pathology_count} pathologie(s)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Cliquez pour voir les pathologies
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-white">
            {viewMode === 'global' 
              ? '🖱️ Survolez et cliquez sur une région anatomique' 
              : '🎯 Survolez et cliquez sur les structures (sphères colorées)'}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Glissez pour pivoter • Molette pour zoomer
          </p>
        </div>

        {/* Bouton retour */}
        {viewMode === 'zoomed' && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg hover:bg:white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>
        )}

        {/* Info zone zoomée (sans structure survolée) */}
        {viewMode === 'zoomed' && selectedZone && !hoveredStructureInfo && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
            <p className="text-sm font-semibold" style={{ color: selectedZone.color }}>
              {selectedZone.display_name}
              {selectedSide !== 'center' && ` (${selectedSide === 'left' ? 'Gauche' : 'Droite'})`}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {zoneStructures.length} structure(s)
            </p>
          </div>
        )}

        {/* Message si aucune structure */}
        {viewMode === 'zoomed' && zoneStructures.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg text-center">
            <p className="text-gray-900 font-semibold mb-2">Aucune structure configurée</p>
            <p className="text-sm text-gray-600">
              Les structures doivent être créées via l'interface admin
            </p>
          </div>
        )}
      </div>

      {/* Modal structure avec liste de pathologies */}
      {showStructureModal && selectedStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: selectedStructure.color }}
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedStructure.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Type : {selectedStructure.type}
                      </p>
                    </div>
                  </div>
                  {selectedStructure.description && (
                    <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">
                      {selectedStructure.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowStructureModal(false)
                    setSelectedStructure(null)
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto">
              <h4 className="font-semibold text-gray-900 mb-3">
                Pathologies de cette structure
              </h4>
              
              {structurePathologies.length > 0 ? (
                <div className="space-y-2">
                  {structurePathologies.map((pathology: Pathology) => {
                    const severityColor = 
                      pathology.severity === 'high' ? 'border-red-300 bg-red-50 hover:bg-red-100' :
                      pathology.severity === 'medium' ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' :
                      'border-green-300 bg-green-50 hover:bg-green-100'
                    
                    const severityLabel =
                      pathology.severity === 'high' ? '🔴 Grave' :
                      pathology.severity === 'medium' ? '🟡 Modérée' :
                      '🟢 Légère'

                    return (
                      <button
                        key={pathology.id}
                        onClick={() => handlePathologyClick(pathology)}
                        className={`w-full p-4 border-2 rounded-lg transition-all text-left ${severityColor}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{pathology.name}</p>
                            {pathology.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2 whitespace-pre-line">
                                {pathology.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">{severityLabel}</p>
                          </div>
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune pathologie configurée pour cette structure</p>
                  <p className="text-sm mt-2">Configurez les pathologies via l'interface admin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal pathologie avec tests + clusters */}
      {showPathologyModal && selectedPathology && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedPathology.name}
                  </h3>
                  {selectedPathology.description && (
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                      {selectedPathology.description}
                    </p>
                  )}
                  {selectedPathology.severity && (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      selectedPathology.severity === 'high' ? 'bg-red-100 text-red-700' :
                      selectedPathology.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      Sévérité : {
                        selectedPathology.severity === 'high' ? 'Grave' :
                        selectedPathology.severity === 'medium' ? 'Modérée' : 'Légère'
                      }
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPathologyModal(false)
                    setSelectedPathology(null)
                    setShowStructureModal(true)
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[65vh] overflow-y-auto">
              {/* CLUSTERS */}
              {pathologyClustersForSelected.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Clusters recommandés
                  </h4>
                  <div className="space-y-3">
                    {pathologyClustersForSelected.map((cluster: any) => (
                      <div
                        key={cluster.id}
                        className="p-4 border-2 border-indigo-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{cluster.name}</p>
                            {cluster.description && (
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                                {cluster.description}
                              </p>
                            )}
                            {(cluster.sensitivity || cluster.specificity) && (
                              <div className="flex gap-4 mt-2 text-xs text-gray-600">
                                {cluster.sensitivity && <span>Se : {cluster.sensitivity}%</span>}
                                {cluster.specificity && <span>Sp : {cluster.specificity}%</span>}
                              </div>
                            )}
                            {cluster.tests && cluster.tests.length > 0 && (
                              <p className="text-xs text-gray-500 mt-2">
                                Inclut : {cluster.tests.map((t: any) => t.name).join(', ')}
                              </p>
                            )}
                          </div>
                          {cluster.tests && cluster.tests.length > 0 && onTestSelect && (
                            <button
                              onClick={() => {
                                onTestSelect(cluster.tests, selectedPathology.name)
                                setShowPathologyModal(false)
                                setShowStructureModal(false)
                              }}
                              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm whitespace-nowrap"
                            >
                              Ajouter le cluster
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TESTS INDIVIDUELS */}
              <h4 className="font-semibold text-gray-900 mb-3">
                Tests orthopédiques recommandés
              </h4>
              
              {pathologyTests[selectedPathology.id]?.length > 0 ? (
                <div className="space-y-3">
                  {pathologyTests[selectedPathology.id].map((test: PathologyTest) => (
                    <div 
                      key={test.id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{test.name}</p>
                            {test.video_url && (
                              <button
                                onClick={() => handleWatchVideo(test.video_url!)}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center gap-1"
                                title="Voir la vidéo"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                </svg>
                                Vidéo
                              </button>
                            )}
                          </div>
                          <TestDescription description={test.description} />
                          {(test.sensitivity || test.specificity) && (
                            <div className="flex gap-4 mt-2">
                              {test.sensitivity && (
                                <span className="text-xs text-gray-600">
                                  Sensibilité: {test.sensitivity}%
                                </span>
                              )}
                              {test.specificity && (
                                <span className="text-xs text-gray-600">
                                  Spécificité: {test.specificity}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (onTestSelect) {
                              onTestSelect([test], selectedPathology.name)
                              setShowPathologyModal(false)
                              setShowStructureModal(false)
                            }
                          }}
                          className="ml-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun test associé à cette pathologie</p>
                  <p className="text-sm mt-2">Configurez les liens via l'interface admin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal vidéo YouTube */}
      {showVideoModal && currentVideoUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900">Vidéo du test</h3>
              <button
                onClick={() => {
                  setShowVideoModal(false)
                  setCurrentVideoUrl(null)
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={currentVideoUrl}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.gltf')
}
