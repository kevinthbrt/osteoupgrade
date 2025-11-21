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

interface Pathology {
  id: string
  zone_id: string
  name: string
  description: string | null
  severity: 'low' | 'medium' | 'high' | null
  position_x: number
  position_y: number
  position_z: number
  size?: number
}

interface PathologyTest {
  id: string
  name: string
  description: string | null
  sensitivity?: number
  specificity?: number
}

interface AnatomyViewer3DProps {
  zones: AnatomyZone[]
  pathologies: Record<string, Pathology[]>
  pathologyTests: Record<string, PathologyTest[]>
  onTestSelect?: (tests: PathologyTest[], pathologyName: string) => void
  modelPath?: string
}

// Zone cliquable avec label SUR LE CÔTÉ
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

  // Position du label : À DROITE de la zone (pas au centre)
  const labelOffset = [
    position[0] + size[0] * 0.8,  // Décalé à droite
    position[1],
    position[2]
  ]

  return (
    <group position={position as [number, number, number]}>
      {/* Zone invisible mais cliquable */}
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
      
      {/* Label DÉCALÉ sur le côté - N'empêche PAS le clic */}
      {isHovered && (
        <Html 
          position={labelOffset as [number, number, number]}
          distanceFactor={8}
        >
          <div 
            className="bg-white px-4 py-2 rounded-lg shadow-xl border-2 whitespace-nowrap pointer-events-none"
            style={{ borderColor: zone.color }}
          >
            <p className="font-bold text-gray-900" style={{ color: zone.color }}>
              {zone.display_name}
            </p>
            {zone.is_symmetric && (
              <p className="text-xs text-gray-600">
                {side === 'left' ? 'Gauche' : side === 'right' ? 'Droite' : ''}
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// Pathologie cliquable dans la vue zoomée - CORRIGÉ
function PathologyMarker({ 
  pathology, 
  zoneColor,
  onClick, 
  isHovered,
  onHover 
}: any) {
  const position: [number, number, number] = [
    pathology.position_x,
    pathology.position_y,
    pathology.position_z
  ]

  const size = pathology.size || 0.08

  // ✅ CORRECTION: Label AU-DESSUS de la sphère avec un offset adapté
  const labelOffset: [number, number, number] = [
    position[0],              // Même X que la sphère
    position[1] + size * 2.5, // AU-DESSUS de la sphère (augmenté de 1.8 à 2.5)
    position[2]               // Même Z que la sphère
  ]

  const severityColor = 
    pathology.severity === 'high' ? '#ef4444' :
    pathology.severity === 'medium' ? '#f59e0b' :
    '#10b981'

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick(pathology)
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
          color={isHovered ? severityColor : zoneColor}
          transparent
          opacity={isHovered ? 0.9 : 0.6}
          emissive={severityColor}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
        />
      </mesh>

      {/* ✅ CORRECTION: Label compact AU-DESSUS avec distanceFactor plus petit */}
      {isHovered && (
        <Html 
          position={labelOffset}
          distanceFactor={2}  // RÉDUIT de 3 à 2 pour éviter qu'il devienne trop grand
          center
          style={{ pointerEvents: 'none' }}
        >
          <div 
            className="bg-white px-2 py-1 rounded-lg shadow-lg border whitespace-nowrap"
            style={{ borderColor: severityColor, maxWidth: '200px' }}
          >
            <p className="font-semibold text-xs" style={{ color: severityColor }}>
              {pathology.name}
            </p>
            {pathology.description && (
              <p className="text-[10px] text-gray-600 mt-0.5 truncate">
                {pathology.description.substring(0, 40)}...
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

// Composant pour gérer le zoom de la caméra
function CameraController({ 
  targetPosition, 
  targetZoom,
  isZooming 
}: any) {
  const { camera, controls } = useThree()
  const controlsRef = useRef<any>(controls)

  useEffect(() => {
    if (isZooming && targetPosition) {
      // Animation du zoom
      const startPos = camera.position.clone()
      const endPos = new THREE.Vector3(
        targetPosition[0],
        targetPosition[1],
        targetPosition[2] + targetZoom
      )

      let progress = 0
      const duration = 1000 // 1 seconde

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

// Modèle 3D
function RealisticBodyModel({ 
  zones,
  pathologies,
  onRegionClick,
  onPathologyClick,
  hoveredRegion, 
  hoveredPathology,
  setHoveredRegion,
  setHoveredPathology,
  modelPath,
  viewMode,
  selectedZone
}: any) {
  const { scene } = useGLTF(modelPath) as any
  
  return (
    <group>
      <primitive 
        object={scene} 
        scale={0.8}
        position={[0, 0.9, 0]}
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

      {viewMode === 'zoomed' && selectedZone && pathologies[selectedZone.id]?.map((pathology: Pathology) => (
        <PathologyMarker
          key={pathology.id}
          pathology={pathology}
          zoneColor={selectedZone.color}
          onClick={onPathologyClick}
          isHovered={hoveredPathology === pathology.id}
          onHover={(hovered: boolean) => setHoveredPathology(hovered ? pathology.id : null)}
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

// Composant principal
export default function AnatomyViewer3D({ 
  zones,
  pathologies,
  pathologyTests,
  onTestSelect,
  modelPath = '/models/human-skeleton.gltf'
}: AnatomyViewer3DProps) {
  const [viewMode, setViewMode] = useState<'global' | 'zoomed'>('global')
  const [selectedZone, setSelectedZone] = useState<AnatomyZone | null>(null)
  const [selectedSide, setSelectedSide] = useState<string>('center')
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [hoveredPathology, setHoveredPathology] = useState<string | null>(null)
  const [isZooming, setIsZooming] = useState(false)
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null)
  const [showPathologyModal, setShowPathologyModal] = useState(false)
  const [selectedPathology, setSelectedPathology] = useState<Pathology | null>(null)

  const handleRegionClick = (zone: AnatomyZone, side: string = 'center') => {
    setSelectedZone(zone)
    setSelectedSide(side)
    
    // Calculer la position de zoom
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

  const handlePathologyClick = (pathology: Pathology) => {
    setSelectedPathology(pathology)
    setShowPathologyModal(true)
  }

  const handleBack = () => {
    setViewMode('global')
    setSelectedZone(null)
    setSelectedSide('center')
    setCameraTarget(null)
    setIsZooming(false)
  }

  const zonePathologies = selectedZone ? pathologies[selectedZone.id] || [] : []

  return (
    <div className="relative">
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
              pathologies={pathologies}
              onRegionClick={handleRegionClick}
              onPathologyClick={handlePathologyClick}
              hoveredRegion={hoveredRegion}
              hoveredPathology={hoveredPathology}
              setHoveredRegion={setHoveredRegion}
              setHoveredPathology={setHoveredPathology}
              modelPath={modelPath}
              viewMode={viewMode}
              selectedZone={selectedZone}
            />
          </Suspense>
        </Canvas>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-white">
            {viewMode === 'global' 
              ? '🖱️ Survolez et cliquez sur une région anatomique' 
              : '🎯 Survolez les pathologies (sphères) pour voir leurs détails'}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Glissez pour pivoter • Molette pour zoomer
          </p>
        </div>

        {/* Bouton retour */}
        {viewMode === 'zoomed' && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg hover:bg-white transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>
        )}

        {/* Info zone zoomée */}
        {viewMode === 'zoomed' && selectedZone && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
            <p className="text-sm font-semibold" style={{ color: selectedZone.color }}>
              {selectedZone.display_name}
              {selectedSide !== 'center' && ` (${selectedSide === 'left' ? 'Gauche' : 'Droite'})`}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {zonePathologies.length} pathologie(s) configurée(s)
            </p>
          </div>
        )}

        {/* Message si aucune pathologie */}
        {viewMode === 'zoomed' && zonePathologies.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg text-center">
            <p className="text-gray-900 font-semibold mb-2">Aucune pathologie configurée</p>
            <p className="text-sm text-gray-600">
              Les pathologies doivent être créées via l'interface admin
            </p>
          </div>
        )}
      </div>

      {/* Modal pathologie */}
      {showPathologyModal && selectedPathology && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedPathology.name}
                  </h3>
                  {selectedPathology.description && (
                    <p className="text-sm text-gray-600 mt-2">
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
                        selectedPathology.severity === 'high' ? 'Élevée' :
                        selectedPathology.severity === 'medium' ? 'Modérée' : 'Faible'
                      }
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPathologyModal(false)
                    setSelectedPathology(null)
                  }}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <h4 className="font-semibold text-gray-900 mb-3">Tests orthopédiques recommandés</h4>
              
              {pathologyTests[selectedPathology.id]?.length > 0 ? (
                <div className="space-y-3">
                  {pathologyTests[selectedPathology.id].map((test: PathologyTest) => (
                    <div 
                      key={test.id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                      onClick={() => {
                        if (onTestSelect) {
                          onTestSelect([test], selectedPathology.name)
                          setShowPathologyModal(false)
                        }
                      }}
                    >
                      <p className="font-semibold text-gray-900">{test.name}</p>
                      {test.description && (
                        <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                      )}
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
    </div>
  )
}

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.gltf')
}
