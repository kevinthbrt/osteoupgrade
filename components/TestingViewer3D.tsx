'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html, useGLTF, Environment } from '@react-three/drei'
import { useState, Suspense } from 'react'

// Types partagés
interface AnatomicalZone {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  position_x: number
  position_y: number
  position_z: number
  size_x: number
  size_y: number
  size_z: number
  is_symmetric: boolean
  model_path: string | null
  is_active: boolean
  display_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

interface TestingViewer3DProps {
  zones: AnatomicalZone[]
  onZoneClick: (zone: AnatomicalZone) => void
  modelPath?: string
  onSpecialCategoryClick?: (category: string) => void
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
        <meshStandardMaterial 
          color={zone.color}
          transparent
          opacity={isHovered ? 0.4 : 0.15}
          emissive={zone.color}
          emissiveIntensity={isHovered ? 0.3 : 0}
        />
      </mesh>
    </group>
  )
}

// Modèle 3D avec zones
function BodyModel({ 
  zones,
  onZoneClick,
  hoveredZone,
  setHoveredZone,
  modelPath
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

      {zones.map((zone: AnatomicalZone) => {
        if (zone.is_symmetric) {
          return (
            <group key={zone.id}>
              <ClickableZone
                zone={zone}
                onClick={onZoneClick}
                isHovered={hoveredZone === `${zone.id}-left`}
                onHover={(hovered: boolean) => setHoveredZone(hovered ? `${zone.id}-left` : null)}
                side="left"
              />
              <ClickableZone
                zone={zone}
                onClick={onZoneClick}
                isHovered={hoveredZone === `${zone.id}-right`}
                onHover={(hovered: boolean) => setHoveredZone(hovered ? `${zone.id}-right` : null)}
                side="right"
              />
            </group>
          )
        }
        
        return (
          <ClickableZone
            key={zone.id}
            zone={zone}
            onClick={onZoneClick}
            isHovered={hoveredZone === zone.id}
            onHover={(hovered: boolean) => setHoveredZone(hovered ? zone.id : null)}
          />
        )
      })}
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
          Chargement du modèle 3D...
        </p>
      </div>
    </Html>
  )
}

// Composant principal
export default function TestingViewer3D({
  zones,
  onZoneClick,
  modelPath = '/models/human-skeleton.gltf',
  onSpecialCategoryClick
}: TestingViewer3DProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)

  const handleZoneClick = (zone: AnatomicalZone, side: string = 'center') => {
    onZoneClick(zone)
  }

  // Zone survolée
  const hoveredZoneInfo = zones.find(z =>
    hoveredZone === z.id ||
    hoveredZone === `${z.id}-left` ||
    hoveredZone === `${z.id}-right`
  )

  const specialCategories = [
    {
      key: 'neurologique',
      label: 'Tests neurologiques',
      color: 'bg-purple-600'
    },
    {
      key: 'vasculaire',
      label: 'Tests vasculaires',
      color: 'bg-red-600'
    },
    {
      key: 'systemique',
      label: 'Tests systémiques',
      color: 'bg-blue-600'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="w-full h-[500px] bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl overflow-hidden relative">
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
            target={[0, 0.9, 0]}
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
            <BodyModel 
              zones={zones}
              onZoneClick={handleZoneClick}
              hoveredZone={hoveredZone}
              setHoveredZone={setHoveredZone}
              modelPath={modelPath}
            />
          </Suspense>
        </Canvas>

        {/* Encart zone survolée - top left corner */}
        {hoveredZoneInfo && (
          <div
            className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border-l-4"
            style={{ borderColor: hoveredZoneInfo.color }}
          >
            <p className="font-semibold text-sm" style={{ color: hoveredZoneInfo.color }}>
              {hoveredZoneInfo.display_name}
            </p>
            {hoveredZone?.includes('-') && (
              <p className="text-xs text-gray-600">
                {hoveredZone.includes('left') ? 'Gauche' : 'Droite'}
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-white">
            🖱️ Survolez et cliquez sur une région anatomique
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Glissez pour pivoter • Molette pour zoomer
          </p>
        </div>

        {/* Message si aucune zone */}
        {zones.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg text-center">
            <p className="text-gray-900 font-semibold mb-2">Aucune zone configurée</p>
            <p className="text-sm text-gray-600">
              Utilisez Anatomy Builder pour créer les zones anatomiques
            </p>
          </div>
        )}

      </div>

      {/* Boutons pour les tests globaux */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {specialCategories.map((category) => (
          <button
            key={category.key}
            onClick={() => onSpecialCategoryClick?.(category.key)}
            className={`${category.color} text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium hover:opacity-90 transition-opacity`}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
}

if (typeof window !== 'undefined') {
  useGLTF.preload('/models/human-skeleton.gltf')
}